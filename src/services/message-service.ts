import pool from '../config/db-config';
import logger from '../config/logger-config';

const messageLogger = logger.child({ module: 'message-service' });

const deleteMessage = async (messageGUID: string): Promise<number> => {
  const deleteMessage = `
    DELETE FROM messages
    WHERE id = $1;
  `;
  const deleteParameters = [messageGUID];

  try {
    const response = await pool.query(deleteMessage, deleteParameters);
    messageLogger.debug(
      `Messages deleted: ${JSON.stringify(response.rowCount)}`
    );

    return response.rowCount ?? 0;
  } catch (err) {
    messageLogger.error(`Error executing delete message query ${err}`);

    return 0;
  }
};

const deleteMessages = async (adminId: number, conversationId: number) => {
  const deleteMessages = `
    DELETE FROM messages
    WHERE admin_id = $1 AND conversation_id = $2;
  `;
  const deleteParameters = [adminId, conversationId];

  try {
    const response = await pool.query(deleteMessages, deleteParameters);
    messageLogger.debug(
      `Messages deleted: ${JSON.stringify(response.rowCount)}`
    );

    return response.rowCount ?? 0;
  } catch (err) {
    messageLogger.error(`Error executing delete messages query ${err}`);

    return 0;
  }
};

const getMessage = async (messageGUID: string): Promise<MessageOutbound> => {
  const selectMessage = `
    SELECT * FROM messages
    WHERE id = $1;
  `;
  const messageParameters = [messageGUID];

  try {
    const response = await pool.query(selectMessage, messageParameters);
    const message = response.rows[0] as MessageOutbound;
    messageLogger.debug(
      `Message retrieved: ${JSON.stringify(response.rows[0])}`
    );

    return message;
  } catch (err) {
    messageLogger.error(`Error executing select message query ${err}`);

    return {} as MessageOutbound;
  }
};

const getTodaysMessages = async (): Promise<MessageOutbound[]> => {
  const selectMessages = `
    SELECT * FROM messages
    WHERE send_date >= CURRENT_DATE
    AND send_date < CURRENT_DATE + INTERVAL '1 day';
  `;

  try {
    const response = await pool.query(selectMessages);
    const messages = response.rows as MessageOutbound[];
    messageLogger.info(`Messages retrieved: ${messages.length}`);
    messageLogger.debug(`Messages retrieved: ${JSON.stringify(messages)}`);

    return messages;
  } catch (err) {
    messageLogger.error(`Error executing select messages query ${err}`);

    return [];
  }
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

    try {
      const response = await pool.query(insertMessage, messageParameters);
      const messageGUID: string = response.rows[0].id;
      messageLogger.debug(`Message saved with GUID: ${messageGUID}`);

      return messageGUID;
    } catch (err) {
      messageLogger.error(`Error executing insert message query ${err}`);

      return '';
    }
  });

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
  getMessage,
  getTodaysMessages,
  saveMessages,
};
