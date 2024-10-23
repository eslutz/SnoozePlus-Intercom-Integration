import pool from '../config/db-config';
import logger from '../config/logger-config';

const messageLogger = logger.child({ module: 'message-service' });

const deleteMessage = async (messageId: string): Promise<number> => {
  const deleteMessage = `
    DELETE FROM messages
    WHERE id = $1;
  `;
  const deleteParameters = [messageId];

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

const deleteMessages = async (
  adminId: number,
  conversationId: number
): Promise<number> => {
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

const getTodaysMessages = async (): Promise<MessageDTO[]> => {
  const selectMessages = `
    SELECT * FROM messages
    WHERE send_date >= CURRENT_DATE
    AND send_date < CURRENT_DATE + INTERVAL '1 day';
  `;

  try {
    const response = await pool.query(selectMessages);
    const messages = response.rows as MessageDTO[];
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

export { deleteMessage, deleteMessages, getTodaysMessages, saveMessages };
