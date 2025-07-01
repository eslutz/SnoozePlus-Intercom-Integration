import schedule from 'node-schedule';
import { container } from '../container/container.js';
import type {
  IIntercomService,
  IMessageService,
} from '../container/interfaces.js';
import { TYPES } from '../container/types.js';
import logger from '../config/logger-config.js';
import { Message } from '../models/message-model.js';
import {
  setLastMessageCloseNote,
  setSendMessageNote,
} from '../utilities/snooze-utility.js';

const scheduleMessageLogger = logger.child({
  module: 'schedule-message-service',
});

/**
 * Helper function to send a scheduled message
 */
const sendScheduledMessage = async (
  message: Message,
  messageFireDate: Date
): Promise<void> => {
  // Get services from DI container for each scheduled execution
  const messageService = container.get<IMessageService>(TYPES.MessageService);
  const intercomService = container.get<IIntercomService>(
    TYPES.IntercomService
  );

  scheduleMessageLogger.debug(
    `Scheduled run: ${messageFireDate.toISOString()}, Actual run: ${new Date().toISOString()}.`
  );

  try {
    scheduleMessageLogger.info(`Sending message ${message.id}`);
    scheduleMessageLogger.profile('sendMessage');
    const messageResponse = await intercomService.sendMessage({
      adminId: message.adminId,
      accessToken: message.accessToken,
      conversationId: message.conversationId,
      message: message.message,
      closeConversation: message.closeConversation,
    });
    scheduleMessageLogger.profile('sendMessage', {
      level: 'info',
      message: `Scheduled message ${message.id} to be sent at ${message.sendDate.toISOString()}`,
    });
    scheduleMessageLogger.debug(
      `Send Messages response: ${JSON.stringify(messageResponse)}`
    );
  } catch (err) {
    scheduleMessageLogger.error(
      `Error sending message ${message.id}: ${String(err)}`
    );
  }

  // Archive the message from the database after it has been sent.
  try {
    scheduleMessageLogger.info(`Archiving message ${message.id}`);
    scheduleMessageLogger.profile('archiveMessage');
    const archivedMessage = await messageService.archiveMessage(message.id);
    scheduleMessageLogger.profile('archiveMessage', {
      level: 'info',
      message: `Archived ${archivedMessage} message with GUID ${message.id}`,
    });
  } catch (err) {
    scheduleMessageLogger.error(`Error deleting message: ${String(err)}`);
  }

  // Add note that the message has been sent and how many messages are remaining.
  try {
    scheduleMessageLogger.info(
      `Adding note that message ${message.id} has been sent.`
    );
    scheduleMessageLogger.profile('addNote');
    const remainingMessages =
      await messageService.getRemainingMessageCount(message);
    const noteResponse = await intercomService.addNote({
      adminId: message.adminId,
      accessToken: message.accessToken,
      conversationId: message.conversationId,
      message: setSendMessageNote(remainingMessages),
    });
    scheduleMessageLogger.profile('addNote', {
      level: 'info',
      message: `Note added to conversation ${message.conversationId} that message ${message.id} has been sent.`,
    });
    scheduleMessageLogger.debug(
      `Add Note response: ${JSON.stringify(noteResponse)}`
    );
  } catch (err) {
    scheduleMessageLogger.error(
      `Error adding note to conversation ${message.conversationId}: ${String(err)}`
    );
  }

  // Close the conversation if the last message is set to close.
  if (message.closeConversation) {
    try {
      scheduleMessageLogger.info(
        'Adding note that the conversation has been closed.'
      );
      scheduleMessageLogger.profile('addNote');
      const noteResponse = await intercomService.addNote({
        adminId: message.adminId,
        accessToken: message.accessToken,
        conversationId: message.conversationId,
        message: setLastMessageCloseNote(),
      });
      scheduleMessageLogger.profile('addNote', {
        level: 'info',
        message: `Note added to conversation ${message.conversationId} that the conversation has been closed.`,
      });
      scheduleMessageLogger.debug(
        `Add Note response: ${JSON.stringify(noteResponse)}`
      );
      scheduleMessageLogger.info(
        `Closing conversation ${message.id}:${message.conversationId}`
      );
      scheduleMessageLogger.profile('closeConversation');
      const closeResponse = await intercomService.closeConversation({
        adminId: message.adminId,
        accessToken: message.accessToken,
        conversationId: message.conversationId,
      });
      scheduleMessageLogger.profile('closeConversation', {
        level: 'info',
        message: `Closed conversation ${message.id}:${message.conversationId}`,
      });
      scheduleMessageLogger.debug(
        `Close conversation response: ${JSON.stringify(closeResponse)}`
      );
    } catch (err) {
      scheduleMessageLogger.error(
        `Error closing conversation ${message.id}: ${String(err)}`
      );
    }
  }
};

/**
 * Schedules and processes messages for automated sending through the system.
 *
 * This function performs the following operations:
 * 1. Retrieves messages scheduled for today
 * 2. For each message:
 *    - Schedules it for sending at the specified time
 *    - Sends the message when scheduled time arrives
 *    - Archives the message after sending
 *    - Adds a note about the message being sent
 *    - Optionally closes the conversation if specified
 *
 * The function handles various error cases at each step and logs operations
 * through the scheduleMessageLogger.
 *
 * If a message's scheduled send date has already passed, it will be sent immediately.
 *
 * @function scheduleMessages
 * @throws Will log but not throw errors that occur during message processing
 * @returns {Promise<void>} Resolves when all messages have been scheduled
 */
const scheduleMessages = async (): Promise<void> => {
  // Get services from DI container
  const messageService = container.get<IMessageService>(TYPES.MessageService);

  let messages: Message[] = [];
  try {
    scheduleMessageLogger.info(
      "Running scheduled task to retrieve today's messages."
    );
    scheduleMessageLogger.profile('getTodaysMessages');
    messages = await messageService.getTodaysMessages();
    scheduleMessageLogger.profile('getTodaysMessages', {
      level: 'info',
      message: `Retrieved ${messages.length} message(s) to send.`,
    });
  } catch (err) {
    scheduleMessageLogger.error(
      `Error retrieving todays messages: ${String(err)}`
    );
  }

  scheduleMessageLogger.info(`Scheduling ${messages.length} message(s).`);
  scheduleMessageLogger.profile('scheduleMessages');
  let messagesScheduled = 0;
  for (const message of messages) {
    // Send the message at the scheduled time.
    scheduleMessageLogger.info(
      `Scheduling message ${message.id} to be sent at ${message.sendDate.toISOString()}`
    );
    scheduleMessageLogger.profile('scheduleMessage');
    try {
      // Check if the send date has already passed. If so, send the message immediately.
      const sendDate =
        message.sendDate <= new Date() ? new Date() : message.sendDate;
      schedule.scheduleJob(
        sendDate,
        async (messageFireDate: Date): Promise<void> => {
          await sendScheduledMessage(message, messageFireDate);
        }
      );
      messagesScheduled++;

      scheduleMessageLogger.profile('scheduleMessage', {
        level: 'info',
        message: `Message ${message.id} has been scheduled.`,
      });
    } catch (err) {
      scheduleMessageLogger.error(
        `Error scheduling message ${message.id}: ${String(err)}`
      );
    }
  }
  scheduleMessageLogger.profile('scheduleMessages', {
    level: 'info',
    message: `There were ${messagesScheduled} of ${messages.length} messages successfully scheduled.`,
  });
};

export default scheduleMessages;
