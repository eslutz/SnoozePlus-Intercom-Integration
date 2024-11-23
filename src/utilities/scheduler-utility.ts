import schedule from 'node-schedule';
import logger from '../config/logger-config';
import sendHeartbeat from '../services/heartbeat-service';
import scheduleMessages from '../services/schedule-message-service';

const schedulerLogger = logger.child({ module: 'scheduler-utility' });

const scheduleJobs = async () => {
  // Schedule the task to run at midnight every day.
  try {
    schedule.scheduleJob('0 0 * * *', async (dailyFireDate) => {
      schedulerLogger.debug(
        `This job was supposed to run at ${dailyFireDate}, but actually ran at ${new Date()}.`
      );
      try {
        await scheduleMessages();
      } catch (err) {
        schedulerLogger.error(`Error running scheduled task: ${err}`);
      }
      if (process.env.NODE_ENV == 'local') {
        await sendHeartbeat();
      }
    });
  } catch (err) {
    schedulerLogger.error(`Error running daily task: ${err}`);
    if (process.env.NODE_ENV !== 'local') {
      await sendHeartbeat(false);
    }
  }
};

export default scheduleJobs;
