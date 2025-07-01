import schedule from 'node-schedule';
import config from '../config/config.js';
import logger from '../config/logger-config.js';
import sendHeartbeat from '../services/heartbeat-service.js';
import scheduleMessages from '../services/schedule-message-service.js';

const schedulerLogger = logger.child({ module: 'scheduler-utility' });

export class MessageScheduler {
  private jobs: Map<string, schedule.Job> = new Map();
  private timeoutMap: Map<string, NodeJS.Timeout> = new Map();
  private isShuttingDown = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic cleanup of completed jobs
    this.cleanupInterval = setInterval(() => {
      this.cleanupCompletedJobs();
    }, 60000); // Every minute
  }

  async scheduleMessage(
    messageId: string, 
    sendDate: Date, 
    callback: () => Promise<void>
  ): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error('Scheduler is shutting down');
    }

    // Cancel existing job if any
    this.cancelJob(messageId);

    const job = schedule.scheduleJob(messageId, sendDate, async () => {
      try {
        schedulerLogger.info('Executing scheduled message', { messageId });
        await callback();
      } catch (error) {
        schedulerLogger.error('Scheduled job failed', { messageId, error });
      } finally {
        // Clean up after execution
        this.jobs.delete(messageId);
        schedulerLogger.debug('Job completed and cleaned up', { messageId });
      }
    });

    if (job) {
      this.jobs.set(messageId, job);
      schedulerLogger.debug('Job scheduled', { 
        messageId, 
        sendDate: sendDate.toISOString(),
        activeJobs: this.jobs.size 
      });
      
      // Set a timeout to clean up jobs that are far in the future (24h+)
      const timeUntilExecution = sendDate.getTime() - Date.now();
      if (timeUntilExecution > 24 * 60 * 60 * 1000) {
        const timeoutId = setTimeout(() => {
          if (this.jobs.has(messageId)) {
            schedulerLogger.warn('Cleaning up long-scheduled job', { messageId });
            this.cancelJob(messageId);
          }
          this.timeoutMap.delete(messageId); // Remove timeout from map after execution
        }, 24 * 60 * 60 * 1000);
        this.timeoutMap.set(messageId, timeoutId); // Store timeout ID in map
      }
    } else {
      throw new Error(`Failed to schedule job for message: ${messageId}`);
    }
  }

  cancelJob(messageId: string): boolean {
    const job = this.jobs.get(messageId);
    if (job) {
      job.cancel();
      this.jobs.delete(messageId);
      
      // Clear associated timeout if it exists
      const timeoutId = this.timeoutMap.get(messageId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.timeoutMap.delete(messageId);
      }
      
      schedulerLogger.debug('Job cancelled', { messageId });
      return true;
    }
    return false;
  }

  private cleanupCompletedJobs(): void {
    let cleanedCount = 0;

    for (const [messageId, job] of this.jobs) {
      const nextInvocation = job.nextInvocation();
      
      // Clean up jobs that have no next invocation (completed)
      if (!nextInvocation) {
        job.cancel();
        this.jobs.delete(messageId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      schedulerLogger.debug('Cleaned up completed jobs', { 
        cleanedCount, 
        remainingJobs: this.jobs.size 
      });
    }
  }

  async shutdown(): Promise<void> {
    schedulerLogger.info('Shutting down message scheduler...');
    this.isShuttingDown = true;
    
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Cancel all jobs
    for (const [messageId, job] of this.jobs) {
      job.cancel();
      schedulerLogger.debug('Cancelled scheduled job during shutdown', { messageId });
    }
    
    // Clear all pending timeouts
    for (const [messageId, timeoutId] of this.timeoutMap) {
      clearTimeout(timeoutId);
      schedulerLogger.debug('Cleared timeout during shutdown', { messageId });
    }
    
    this.jobs.clear();
    this.timeoutMap.clear();
    
    // Wait for graceful shutdown
    await schedule.gracefulShutdown();
    schedulerLogger.info('Message scheduler shutdown complete');
  }

  // Monitoring methods
  getActiveJobCount(): number {
    return this.jobs.size;
  }

  getJobInfo(messageId: string): { nextInvocation: Date | null } | null {
    const job = this.jobs.get(messageId);
    if (job) {
      return {
        nextInvocation: job.nextInvocation(),
      };
    }
    return null;
  }

  getAllJobsInfo(): Array<{ messageId: string; nextInvocation: Date | null }> {
    return Array.from(this.jobs.entries()).map(([messageId, job]) => ({
      messageId,
      nextInvocation: job.nextInvocation(),
    }));
  }
}

// Singleton instance
export const messageScheduler = new MessageScheduler();

/**
 * Schedules jobs to run at specified intervals.
 *
 * This function schedules a task to run every 6 hours using the `schedule.scheduleJob` method.
 * It logs the scheduled and actual run times, and attempts to execute the `scheduleMessages` function.
 * If an error occurs during the execution of the scheduled task, it logs the error.
 * Additionally, if the application is running in a production environment, it sends a heartbeat signal.
 *
 * @function scheduleJobs
 * @returns {Promise<void>} A promise that resolves when the jobs are scheduled
 * @throws Will log an error if scheduling the job fails.
 */
const scheduleJobs = async (): Promise<void> => {
  // Schedule the task to run every 6 hours using the new scheduler
  try {
    const job = schedule.scheduleJob(
      '0 */6 * * *',
      async (scheduledFireDate: Date): Promise<void> => {
        schedulerLogger.debug(
          `Scheduled run: ${scheduledFireDate.toISOString()}, Actual run: ${new Date().toISOString()}.`
        );
        try {
          await scheduleMessages();
        } catch (err) {
          schedulerLogger.error(`Error running scheduled task: ${String(err)}`);
        }
        if (config.isProduction) {
          await sendHeartbeat();
        }
      }
    );

    if (job) {
      schedulerLogger.info('Recurring job scheduled successfully', { 
        schedule: '0 */6 * * *',
        nextRun: job.nextInvocation()?.toISOString() 
      });
    }
  } catch (err) {
    schedulerLogger.error(`Error running scheduled task: ${String(err)}`);
    if (config.isProduction) {
      await sendHeartbeat(false);
    }
  }
};

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  await messageScheduler.shutdown();
});

process.on('SIGINT', async () => {
  await messageScheduler.shutdown();
});

export default scheduleJobs;
