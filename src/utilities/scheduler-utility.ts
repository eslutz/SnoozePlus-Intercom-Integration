import schedule from 'node-schedule';
import logger from '../config/logger-config';
import { sendHeartbeat } from '../services/heartbeat-service';
import {
  deleteMessage,
  getRemainingMessageCount,
  getTodaysMessages,
} from '../services/message-service';
import {
  addNote,
  closeConversation,
  sendMessage,
} from '../services/intercom-service';
import { setLastMessageCloseNote, setSendMessageNote } from './snooze-utility';

const schedulerLogger = logger.child({ module: 'scheduler-utility' });

const scheduleMessageSending = () => {
  // Schedule the task to run at midnight every day.
  try {
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
          message: `Retrieved ${messages.length} message(s) to send.`,
        });

        schedulerLogger.info(`Scheduling ${messages.length} message(s).`);
        schedulerLogger.profile('scheduleMessages');
        let messagesScheduled = 0;
        for (const message of messages) {
          // Send the message at the scheduled time.
          schedulerLogger.info(
            `Scheduling message ${message.id} to be sent at ${message.sendDate}`
          );
          schedulerLogger.profile('scheduleMessage');
          try {
            // Check if the send date has already passed. If so, send the message immediately.
            const sendDate =
              message.sendDate <= new Date() ? new Date() : message.sendDate;
            schedule.scheduleJob(sendDate, async (messageFireDate) => {
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
                const deletedMessage = await deleteMessage(message.id);
                schedulerLogger.profile('deleteMessage', {
                  level: 'info',
                  message: `Deleted ${deletedMessage} message with GUID ${message.id}`,
                });
              } catch (err) {
                schedulerLogger.error(`Error deleting message: ${err}`);
              }

              // Add note that the message has been sent and how many messages are remaining.
              try {
                schedulerLogger.info(
                  `Adding note that message ${message.id} has been sent.`
                );
                schedulerLogger.profile('addNote');
                const remainingMessages =
                  await getRemainingMessageCount(message);
                const noteResponse = await addNote({
                  adminId: message.adminId,
                  conversationId: message.conversationId,
                  note: setSendMessageNote(remainingMessages),
                });
                schedulerLogger.profile('addNote', {
                  level: 'info',
                  message: `Note added to conversation ${message.conversationId} that message ${message.id} has been sent.`,
                });
                schedulerLogger.debug(
                  `Add Note response: ${JSON.stringify(noteResponse)}`
                );
              } catch (err) {
                schedulerLogger.error(
                  `Error adding note to conversation ${message.conversationId}: ${err}`
                );
              }

              // Close the conversation if the last message is set to close.
              if (message.closeConversation) {
                try {
                  schedulerLogger.info(
                    'Adding note that the conversation has been closed.'
                  );
                  schedulerLogger.profile('addNote');
                  const closeNote: NoteRequest = {
                    adminId: message.adminId,
                    conversationId: message.conversationId,
                    note: setLastMessageCloseNote(),
                  };
                  const noteResponse = await addNote(closeNote);
                  schedulerLogger.profile('addNote', {
                    level: 'info',
                    message: `Note added to conversation ${message.conversationId} that the conversation has been closed.`,
                  });
                  schedulerLogger.debug(
                    `Add Note response: ${JSON.stringify(noteResponse)}`
                  );
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
            messagesScheduled++;

            schedulerLogger.profile('scheduleMessage', {
              level: 'info',
              message: `Message ${message.id} has been scheduled.`,
            });
          } catch (err) {
            schedulerLogger.error(
              `Error scheduling message ${message.id}: ${err}`
            );
          }
        }
        schedulerLogger.profile('scheduleMessages', {
          level: 'info',
          message: `There were ${messagesScheduled} of ${messages.length} messages successfully scheduled.`,
        });
      } catch (err) {
        schedulerLogger.error(`Error running scheduled task: ${err}`);
      }
      sendHeartbeat();
    });
  } catch (err) {
    schedulerLogger.error(`Error running daily task: ${err}`);
    sendHeartbeat(false);
  }
};

export default scheduleMessageSending;
