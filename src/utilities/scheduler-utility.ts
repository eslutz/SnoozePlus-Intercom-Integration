import schedule from 'node-schedule';
import config from '../config/config.js';
import logger from '../config/logger-config.js';
import sendHeartbeat from '../services/heartbeat-service.js';
import scheduleMessages from '../services/schedule-message-service.js';

const schedulerLogger = logger.child({ module: 'scheduler-utility' });

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
  // Schedule the task to run every 6 hours
  try {
    schedule.scheduleJob('0 */6 * * *', async (scheduledFireDate) => {
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
    });
  } catch (err) {
    schedulerLogger.error(`Error running scheduled task: ${String(err)}`);
    if (config.isProduction) {
      await sendHeartbeat(false);
    }
  }
};

export default scheduleJobs;
