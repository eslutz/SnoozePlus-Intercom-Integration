import schedule from 'node-schedule';
import logger from '../config/logger-config';
import { deleteMessage, getTodaysMessages } from '../services/message-service';
import { closeConversation, sendMessage } from '../services/intercom-service';

const schedulerLogger = logger.child({ module: 'scheduler-utility' });

const scheduleMessageSending = () => {
  // Schedule the task to run at midnight every day
  schedule.scheduleJob('0 0 * * *', async (dailyFireDate) => {
    schedulerLogger.debug(
      `This job was supposed to run at ${dailyFireDate}, but actually ran at ${new Date()}.`
    );
    try {
      schedulerLogger.info(
        "Running scheduled task to retrieve today's messages."
      );
      schedulerLogger.profile('getTodaysMessages');
      const messages = await getTodaysMessages();
      schedulerLogger.profile('getTodaysMessages', {
        level: 'info',
        message: `Retrieved ${messages.length} messages to send.`,
      });

      schedulerLogger.info(`Scheduling ${messages.length} messages.`);
      schedulerLogger.profile('scheduleMessages');
      for (const message of messages) {
        // Send the message at the scheduled time.
        schedulerLogger.info(
          `Scheduling message ${message.id} to be sent at ${message.sendDate}`
        );
        schedulerLogger.profile('scheduleMessage');
        try {
          schedule.scheduleJob(message.sendDate, async (messageFireDate) => {
            schedulerLogger.debug(
              `This job was supposed to run at ${messageFireDate}, but actually ran at ${new Date()}.`
            );
            try {
              schedulerLogger.info(`Sending message ${message.id}`);
              schedulerLogger.profile('sendMessage');
              const messageResponse = await sendMessage(message);
              schedulerLogger.profile('sendMessage', {
                level: 'info',
                message: `Scheduled message ${message.id} to be sent at ${message.sendDate}`,
              });
              schedulerLogger.debug(
                `Send Messages response: ${JSON.stringify(messageResponse)}`
              );
            } catch (err) {
              schedulerLogger.error(
                `Error sending message ${message.id}: ${err}`
              );
            }

            // Delete the message from the database after it has been sent.
            try {
              schedulerLogger.info(`Deleting message ${message.id}`);
              schedulerLogger.profile('deleteMessage');
              const deletedMessages = await deleteMessage(message.id);
              schedulerLogger.profile('deleteMessage', {
                level: 'info',
                message: `Deleted ${deletedMessages} message with GUID ${message.id}`,
              });
            } catch (err) {
              schedulerLogger.error(`Error deleting message: ${err}`);
            }

            // Close the conversation if the last message is set to close.
            if (message.closeConversation) {
              try {
                schedulerLogger.info(
                  `Closing conversation ${message.id}:${message.conversationId}`
                );
                schedulerLogger.profile('closeConversation');
                const closeResponse = await closeConversation(message);
                schedulerLogger.profile('closeConversation', {
                  level: 'info',
                  message: `Closed conversation ${message.id}:${message.conversationId}`,
                });
                schedulerLogger.debug(
                  `Close conversation response: ${JSON.stringify(closeResponse)}`
                );
              } catch (err) {
                schedulerLogger.error(
                  `Error closing conversation ${message.id}: ${err}`
                );
              }
            }
          });
        } catch (err) {
          schedulerLogger.error(
            `Error scheduling message ${message.id}: ${err}`
          );
        }
        schedulerLogger.profile('scheduleMessage', {
          level: 'info',
          message: `Message ${message.id} has been scheduled.`,
        });
      }
      schedulerLogger.profile('scheduleMessages', {
        level: 'info',
        message: `All ${messages.length} messages have been scheduled successfully.`,
      });
    } catch (err) {
      schedulerLogger.error(`Error running scheduled task: ${err}`);
    }
  });
};

export default scheduleMessageSending;
