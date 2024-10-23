import schedule from 'node-schedule';
import logger from '../config/logger-config';
import { deleteMessage, getTodaysMessages } from '../services/message-service';
import { sendMessage } from '../services/intercom-service';

const schedulerLogger = logger.child({ module: 'scheduler-utility' });

const scheduleMessageSending = () => {
  // Schedule the task to run at midnight every day
  schedule.scheduleJob('0 0 * * *', async () => {
    try {
      schedulerLogger.info(
        "Running scheduled task to retrieve today's messages."
      );
      const messages = await getTodaysMessages();
      schedulerLogger.info(`Retrieved ${messages.length} messages to send.`);

      for (const message of messages) {
        schedule.scheduleJob(message.sendDate, async () => {
          // Send the message at the scheduled time.
          try {
            const messageResponse = await sendMessage(message);
            schedulerLogger.info(
              `Scheduled message ${message.guid} to be sent at ${message.sendDate}`
            );
            schedulerLogger.debug(
              `Save Messages response: ${JSON.stringify(messageResponse)}`
            );
          } catch (err) {
            schedulerLogger.error(`Error sending message: ${err}`);
          }

          // Delete the message from the database after it has been sent.
          try {
            const deletedMessages = await deleteMessage(message.guid);
            schedulerLogger.info(
              `Deleted ${deletedMessages} message with GUID ${message.guid}`
            );
          } catch (err) {
            schedulerLogger.error(`Error deleting message: ${err}`);
          }
        });
      }
    } catch (err) {
      schedulerLogger.error(`Error running scheduled task: ${err}`);
    }
  });
};

export default scheduleMessageSending;
