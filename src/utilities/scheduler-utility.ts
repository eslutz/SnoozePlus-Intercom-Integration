import schedule from 'node-schedule';
import logger from '../config/logger-config.js';
import sendHeartbeat from '../services/heartbeat-service.js';
import scheduleMessages from '../services/schedule-message-service.js';

const schedulerLogger = logger.child({ module: 'scheduler-utility' });

const scheduleJobs = async () => {
  // Schedule the task to run every 6 hours
  try {
    schedule.scheduleJob('0 */6 * * *', async (scheduledFireDate) => {
      schedulerLogger.debug(
        `Scheduled run: ${scheduledFireDate}, Actual run: ${new Date()}.`
      );
      try {
        await scheduleMessages();
      } catch (err) {
        schedulerLogger.error(`Error running scheduled task: ${err}`);
      }
      if (process.env.NODE_ENV === 'production') {
        await sendHeartbeat();
      }
    });
  } catch (err) {
    schedulerLogger.error(`Error running scheduled task: ${err}`);
    if (process.env.NODE_ENV === 'production') {
      await sendHeartbeat(false);
    }
  }
};

export default scheduleJobs;
