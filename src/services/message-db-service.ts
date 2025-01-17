import pool from '../config/db-config';
import logger from '../config/logger-config';
import operation from '../config/retry-config';
import { MessageDTO } from '../models/dto-message-model';
import { Message } from '../models/message-model';

const messageDbLogger = logger.child({ module: 'message-db-service' });

const archiveMessage = async (messageId: string): Promise<number> => {
  const archiveMessage = `
    UPDATE messages
    SET archived = TRUE
    WHERE id = $1;
  `;
  const archiveParameters = [messageId];

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const response = await pool.query(archiveMessage, archiveParameters);
        messageDbLogger.debug(
          `Messages archived: ${JSON.stringify(response.rowCount)}`
        );

        resolve(response.rowCount ?? 0);
      } catch (err) {
        messageDbLogger.error(
          `Error executing archive message query on attempt ${currentAttempt}: ${err}`
        );
        if (operation.retry(err as Error)) {
          return;
        }
        reject(operation.mainError());
      }
    });
  });
};

const archiveMessages = async (
  adminId: number,
  conversationId: number
): Promise<number> => {
  const archiveMessages = `
    UPDATE messages
    SET archived = TRUE
    WHERE admin_id = $1 AND conversation_id = $2;
  `;
  const archiveParameters = [adminId, conversationId];

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const response = await pool.query(archiveMessages, archiveParameters);
        messageDbLogger.debug(
          `Messages archived: ${JSON.stringify(response.rowCount)}`
        );

        resolve(response.rowCount ?? 0);
      } catch (err) {
        messageDbLogger.error(
          `Error executing archive messages query on attempt ${currentAttempt}: ${err}`
        );
        if (operation.retry(err as Error)) {
          return;
        }
        reject(operation.mainError());
      }
    });
  });
};

const deleteMessage = async (messageId: string): Promise<number> => {
  const deleteMessage = `
    DELETE FROM messages
    WHERE id = $1;
  `;
  const deleteParameters = [messageId];

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const response = await pool.query(deleteMessage, deleteParameters);
        messageDbLogger.debug(
          `Messages deleted: ${JSON.stringify(response.rowCount)}`
        );

        resolve(response.rowCount ?? 0);
      } catch (err) {
        messageDbLogger.error(
          `Error executing delete message query on attempt ${currentAttempt}: ${err}`
        );
        if (operation.retry(err as Error)) {
          return;
        }
        reject(operation.mainError());
      }
    });
  });
};

const deleteMessages = async (
  adminId: number,
  conversationId: number
): Promise<number> => {
  const deleteMessages = `
    DELETE FROM messages
    WHERE admin_id = $1 AND conversation_id = $2;
  `;
  const deleteParameters = [adminId, conversationId];

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const response = await pool.query(deleteMessages, deleteParameters);
        messageDbLogger.debug(
          `Messages deleted: ${JSON.stringify(response.rowCount)}`
        );

        resolve(response.rowCount ?? 0);
      } catch (err) {
        messageDbLogger.error(
          `Error executing delete messages query on attempt ${currentAttempt}: ${err}`
        );
        if (operation.retry(err as Error)) {
          return;
        }
        reject(operation.mainError());
      }
    });
  });
};

const getMessages = async (
  adminId: number,
  conversationId: number
): Promise<MessageDTO[]> => {
  const selectMessages = `
    SELECT message, send_date
    FROM messages
    WHERE NOT messages.archived
    AND admin_id = $1 AND conversation_id = $2;
  `;
  const selectParameters = [adminId, conversationId];

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const response = await pool.query(selectMessages, selectParameters);
        const messages = response.rows.map((row) => ({
          message: row.message as string,
          sendDate: new Date(row.send_date),
        })) as MessageDTO[];
        messageDbLogger.debug(
          `Messages retrieved: ${JSON.stringify(messages.map((message) => message.id))}`
        );

        resolve(messages);
      } catch (err) {
        messageDbLogger.error(
          `Error executing select messages query on attempt ${currentAttempt}: ${err}`
        );
        if (operation.retry(err as Error)) {
          return;
        }
        reject(operation.mainError());
      }
    });
  });
};

const getRemainingMessageCount = async (
  message: MessageDTO
): Promise<number> => {
  const messageCount = `
    SELECT COUNT(*)
    FROM messages
    WHERE NOT archived
    AND admin_id = $1 AND conversation_id = $2;
  `;
  const messageCountParameters = [message.adminId, message.conversationId];

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const response = await pool.query(messageCount, messageCountParameters);
        const remainingMessages = response.rows[0].count as number;
        messageDbLogger.debug(`Remaining messages: ${remainingMessages}`);

        resolve(remainingMessages);
      } catch (err) {
        messageDbLogger.error(
          `Error executing count messages query on attempt ${currentAttempt}: ${err}`
        );
        if (operation.retry(err as Error)) {
          return;
        }
        reject(operation.mainError());
      }
    });
  });
};

const getTodaysMessages = async (): Promise<MessageDTO[]> => {
  const selectMessages = `
    SELECT messages.*, users.access_token
    FROM messages
    INNER JOIN users ON messages.admin_id = users.id
    WHERE NOT messages.archived
    AND messages.send_date < CURRENT_DATE + INTERVAL '1 day';
  `;

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const response = await pool.query(selectMessages);
        const messages = response.rows.map((row) => ({
          id: row.id as string,
          adminId: row.admin_id as number,
          adminAccessToken: row.access_token as string,
          conversationId: row.conversation_id as number,
          message: row.message as string,
          sendDate: new Date(row.send_date),
          closeConversation: row.close_conversation as boolean,
          archived: row.archived as boolean,
        })) as MessageDTO[];
        messageDbLogger.debug(
          `Messages retrieved: ${JSON.stringify(messages.map((message) => message.id))}`
        );

        resolve(messages);
      } catch (err) {
        messageDbLogger.error(
          `Error executing select messages query on attempt ${currentAttempt}: ${err}`
        );
        if (operation.retry(err as Error)) {
          return;
        }
        reject(operation.mainError());
      }
    });
  });
};

const saveMessages = async (
  adminId: number,
  conversationId: number,
  messages: Message[]
): Promise<string[]> => {
  let messageGUIDs: string[] = [];

  const promises = messages.map(async (message): Promise<string> => {
    const insertMessage = `
      INSERT INTO messages (admin_id, conversation_id, message, send_date, close_conversation)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
      `;
    const messageParameters = [
      adminId,
      conversationId,
      message.message,
      message.sendDate,
      message.closeConversation,
    ];

    // Save the message to the database.
    return new Promise((resolve, reject) => {
      operation.attempt(async (currentAttempt) => {
        try {
          const response = await pool.query(insertMessage, messageParameters);
          const messageGUID: string = response.rows[0].id;
          messageDbLogger.debug(`Message saved with GUID: ${messageGUID}`);

          resolve(messageGUID);
        } catch (err) {
          messageDbLogger.error(
            `Error executing insert message query on attempt ${currentAttempt}: ${err}`
          );
          if (operation.retry(err as Error)) {
            return;
          }
          reject(operation.mainError());
        }
      });
    });
  });

  // Wait for all messages to be saved before returning the GUIDs.
  try {
    messageGUIDs = await Promise.all(promises);
  } catch (err) {
    messageDbLogger.error(`Error saving messages: ${err}`);
  }

  return messageGUIDs;
};

export {
  archiveMessage,
  archiveMessages,
  deleteMessage,
  deleteMessages,
  getMessages,
  getRemainingMessageCount,
  getTodaysMessages,
  saveMessages,
};
