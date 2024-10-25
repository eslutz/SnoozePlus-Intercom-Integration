import pool from '../config/db-config';
import logger from '../config/logger-config';
import operation from '../config/retry-config';
import { encrypt } from '../utilities/crypto-utility';

const messageLogger = logger.child({ module: 'message-service' });

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
        messageLogger.debug(
          `Messages deleted: ${JSON.stringify(response.rowCount)}`
        );

        resolve(response.rowCount ?? 0);
      } catch (err) {
        messageLogger.error(
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
        messageLogger.debug(
          `Messages deleted: ${JSON.stringify(response.rowCount)}`
        );

        resolve(response.rowCount ?? 0);
      } catch (err) {
        messageLogger.error(
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

const getRemainingMessageCount = async (
  message: MessageDTO
): Promise<number> => {
  const messageCount = `
    SELECT COUNT(*) FROM messages
    WHERE admin_id = $1 AND conversation_id = $2;
  `;
  const messageCountParameters = [message.adminId, message.conversationId];

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const response = await pool.query(messageCount, messageCountParameters);
        const remainingMessages = response.rows[0].count as number;
        messageLogger.debug(`Remaining messages: ${remainingMessages}`);

        resolve(remainingMessages);
      } catch (err) {
        messageLogger.error(
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
    SELECT * FROM messages
    WHERE send_date < CURRENT_DATE + INTERVAL '1 day';
  `;

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const response = await pool.query(selectMessages);
        const messages = response.rows.map((row) => ({
          id: row.id as string,
          adminId: row.admin_id as number,
          conversationId: row.conversation_id as number,
          message: row.message as string,
          sendDate: new Date(row.send_date),
          closeConversation: row.close_conversation as boolean,
        })) as MessageDTO[];
        messageLogger.debug(
          `Messages retrieved: ${JSON.stringify(messages.map((message) => message.id))}`
        );

        resolve(messages);
      } catch (err) {
        messageLogger.error(
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
    // Encrypt the message before saving it to the database.
    let encryptedMessage: string;
    messageLogger.info('Encrypting message.');
    messageLogger.profile('encrypt');
    try {
      encryptedMessage = encrypt(message.message);
    } catch (err) {
      messageLogger.error(`Error encrypting message: ${err}`);
      throw err;
    }
    messageLogger.profile('encrypt', {
      level: 'info',
      message: 'Message encrypted.',
    });

    const insertMessage = `
      INSERT INTO messages (admin_id, conversation_id, message, send_date, close_conversation)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
      `;
    const messageParameters = [
      adminId,
      conversationId,
      encryptedMessage,
      message.sendDate,
      message.closeConversation,
    ];

    // Save the message to the database.
    return new Promise((resolve, reject) => {
      operation.attempt(async (currentAttempt) => {
        try {
          const response = await pool.query(insertMessage, messageParameters);
          const messageGUID: string = response.rows[0].id;
          messageLogger.debug(`Message saved with GUID: ${messageGUID}`);

          resolve(messageGUID);
        } catch (err) {
          messageLogger.error(
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
    messageLogger.error(`Error saving messages: ${err}`);
  }

  return messageGUIDs;
};

export {
  deleteMessage,
  deleteMessages,
  getRemainingMessageCount,
  getTodaysMessages,
  saveMessages,
};
