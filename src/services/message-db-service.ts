import pool from '../config/db-config.js';
import logger from '../config/logger-config.js';
import createRetryOperation from '../config/retry-config.js';
import { MessageDTO } from '../models/message-dto-model.js';
import {
  Message,
  mapMessageDTOToMessage,
  mapMessageDTOToMessageWithoutAuth,
} from '../models/message-model.js';

const messageDbLogger = logger.child({ module: 'message-db-service' });

/**
 * Archives a message in the database by setting its 'archived' flag to TRUE.
 * Uses retry logic to handle potential database connection issues.
 *
 * @function archiveMessage
 * @param messageId The unique identifier of the message to be archived
 * @returns {Promise<number>} A Promise that resolves to the number of rows affected (should be 1 if successful, 0 if message not found)
 * @throws Will throw an error if all retry attempts fail to execute the database query
 */
const archiveMessage = async (messageId: string): Promise<number> => {
  const archiveMessageQuery = `
    UPDATE messages
    SET archived = TRUE
    WHERE id = $1;
  `;
  const archiveParameters = [messageId];
  const operation = createRetryOperation();

  return new Promise((resolve, reject) => {
    operation.attempt((currentAttempt) => {
      pool
        .query(archiveMessageQuery, archiveParameters)
        .then((response) => {
          messageDbLogger.debug(
            `Messages archived: ${JSON.stringify(response.rowCount)}`
          );
          resolve(response.rowCount ?? 0);
        })
        .catch((err: Error) => {
          messageDbLogger.error(
            `Error executing archive message query on attempt ${currentAttempt}: ${err}`
          );
          if (operation.retry(err)) {
            return;
          }
          reject(operation.mainError()!);
        });
    });
  });
};

/**
 * Archives messages in the database for a specific workspace and conversation.
 *
 * @function archiveMessages
 * @param workspaceId The unique identifier of the workspace
 * @param conversationId The numeric identifier of the conversation
 * @returns {Promise<number>} Promise that resolves to the number of messages archived
 * @throws Error if the database operation fails after all retry attempts
 */
const archiveMessages = async (
  workspaceId: string,
  conversationId: number
): Promise<number> => {
  const archiveMessagesQuery = `
    UPDATE messages
    SET archived = TRUE
    WHERE workspace_id = $1 AND conversation_id = $2;
  `;
  const archiveParameters = [workspaceId, conversationId];
  const operation = createRetryOperation();

  return new Promise((resolve, reject) => {
    operation.attempt((currentAttempt) => {
      pool
        .query(archiveMessagesQuery, archiveParameters)
        .then((response) => {
          messageDbLogger.debug(
            `Messages archived: ${JSON.stringify(response.rowCount)}`
          );
          resolve(response.rowCount ?? 0);
        })
        .catch((err: Error) => {
          messageDbLogger.error(
            `Error executing archive messages query on attempt ${currentAttempt}: ${err}`
          );
          if (operation.retry(err)) {
            return;
          }
          reject(operation.mainError()!);
        });
    });
  });
};

/**
 * Retrieves messages from the database for a specific workspace and conversation.
 * The messages are ordered by send date in ascending order and excludes archived messages.
 * Implements retry logic for database operations.
 *
 * @function getMessages
 * @param workspaceId The unique identifier of the workspace
 * @param conversationId The numeric identifier of the conversation
 * @returns {Promise<Message[]>} Promise resolving to an array of Message objects
 * @throws Will throw an error if database operations fail after all retry attempts
 */
const getMessages = async (
  workspaceId: string,
  conversationId: number
): Promise<Message[]> => {
  const selectMessages = `
    SELECT id, workspace_id, conversation_id, message, send_date, close_conversation, archived
    FROM messages
    WHERE NOT archived
      AND workspace_id = $1 AND conversation_id = $2
    ORDER BY send_date ASC;
  `;
  const selectParameters = [workspaceId, conversationId];
  const operation = createRetryOperation();

  return new Promise((resolve, reject) => {
    operation.attempt((currentAttempt) => {
      pool
        .query<MessageDTO>(selectMessages, selectParameters)
        .then((response) => {
          const messages: Message[] = response.rows.map((row) =>
            mapMessageDTOToMessageWithoutAuth(row)
          );
          messageDbLogger.debug(
            `Messages retrieved: ${JSON.stringify(messages.map((m) => m.id))}`
          );
          resolve(messages);
        })
        .catch((err: Error) => {
          messageDbLogger.error(
            `Error executing select messages query on attempt ${currentAttempt}: ${err}`
          );
          if (operation.retry(err)) {
            return;
          }
          reject(operation.mainError()!);
        });
    });
  });
};

/**
 * Retrieves the count of unarchived messages for a specific workspace and conversation.
 *
 * @function getRemainingMessageCount
 * @param message The message object containing workspaceId and conversationId
 * @returns {Promise<number>} Promise that resolves to the number of remaining unarchived messages
 * @throws Error if the database query fails after all retry attempts
 */
const getRemainingMessageCount = async (message: Message): Promise<number> => {
  const messageCountQuery = `
    SELECT COUNT(*)
    FROM messages
    WHERE NOT archived
      AND workspace_id = $1 AND conversation_id = $2;
  `;
  const messageCountParameters = [message.workspaceId, message.conversationId];
  const operation = createRetryOperation();

  return new Promise((resolve, reject) => {
    operation.attempt((currentAttempt) => {
      pool
        .query<{ count: string }>(messageCountQuery, messageCountParameters)
        .then((response) => {
          const remainingMessages = parseInt(response.rows[0].count, 10);
          messageDbLogger.debug(`Remaining messages: ${remainingMessages}`);
          resolve(remainingMessages);
        })
        .catch((err: Error) => {
          messageDbLogger.error(
            `Error executing count messages query on attempt ${currentAttempt}: ${err}`
          );
          if (operation.retry(err)) {
            return;
          }
          reject(operation.mainError()!);
        });
    });
  });
};

/**
 * Retrieves all unarchived messages scheduled to be sent before the end of the current day.
 *
 * This function queries the database for messages that are:
 * - Not archived
 * - Scheduled to be sent before midnight of the current day
 * - Joined with user information for admin_id and access_token
 *
 * The operation includes retry logic for handling temporary database connection issues.
 *
 * @function getTodaysMessages
 * @returns {Promise<Message[]>} A promise that resolves to an array of Message objects
 * @throws {Error} If all retry attempts fail when querying the database
 */
const getTodaysMessages = async (): Promise<Message[]> => {
  const selectMessages = `
    SELECT m.id, m.workspace_id, m.conversation_id, m.message, m.send_date, m.close_conversation, m.archived,
           u.admin_id, u.access_token
    FROM messages m
    INNER JOIN users u ON m.workspace_id = u.workspace_id
    WHERE NOT m.archived
      AND m.send_date < CURRENT_DATE + INTERVAL '1 day';
  `;
  const operation = createRetryOperation();

  return new Promise((resolve, reject) => {
    operation.attempt((currentAttempt) => {
      pool
        .query<MessageDTO & { admin_id: number; access_token: string }>(
          selectMessages
        )
        .then((response) => {
          const messages = response.rows.map((row) =>
            mapMessageDTOToMessage(row, row.admin_id, row.access_token)
          );
          messageDbLogger.debug(
            `Messages retrieved: ${JSON.stringify(messages.map((m) => m.id))}`
          );
          resolve(messages);
        })
        .catch((err: Error) => {
          messageDbLogger.error(
            `Error executing select messages query on attempt ${currentAttempt}: ${err}`
          );
          if (operation.retry(err)) {
            return;
          }
          reject(operation.mainError()!);
        });
    });
  });
};

/**
 * Saves multiple messages to the database for a given workspace and conversation.
 * Uses retry logic for handling transient database errors.
 *
 * @function saveMessages
 * @param workspaceId The unique identifier of the workspace
 * @param conversationId The numeric identifier of the conversation
 * @param messages Array of Message objects to be saved
 * @returns {Promise<string[]>} Promise resolving to an array of message GUIDs (strings) for the saved messages
 * @throws Will log but not throw if database operations fail after retry attempts
 */
const saveMessages = async (
  workspaceId: string,
  conversationId: number,
  messages: Message[]
): Promise<string[]> => {
  let messageGUIDs: string[] = [];
  const operation = createRetryOperation();

  const promises = messages.map((message): Promise<string> => {
    const insertMessage = `
      INSERT INTO messages (workspace_id, conversation_id, message, send_date, close_conversation)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `;
    const messageParameters = [
      workspaceId,
      conversationId,
      message.message,
      message.sendDate.toISOString(),
      message.closeConversation,
    ];

    return new Promise((resolve, reject) => {
      operation.attempt((currentAttempt) => {
        pool
          .query<{ id: string }>(insertMessage, messageParameters)
          .then((response) => {
            const messageGUID: string = response.rows[0].id;
            messageDbLogger.debug(`Message saved with GUID: ${messageGUID}`);
            resolve(messageGUID);
          })
          .catch((err: Error) => {
            messageDbLogger.error(
              `Error executing insert message query on attempt ${currentAttempt}: ${err}`
            );
            if (operation.retry(err)) {
              return;
            }
            reject(operation.mainError()!);
          });
      });
    });
  });

  try {
    messageGUIDs = await Promise.all(promises);
  } catch (err) {
    messageDbLogger.error(`Error saving messages: ${String(err)}`);
  }

  return messageGUIDs;
};

export {
  archiveMessage,
  archiveMessages,
  getMessages,
  getRemainingMessageCount,
  getTodaysMessages,
  saveMessages,
};
