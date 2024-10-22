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

const saveMessage = async (snoozeRequest: SnoozeRequest): Promise<string[]> => {
  let messageGUIDs: string[] = [];

  const promises = snoozeRequest.messages.map(
    async (message): Promise<string> => {
      const insertMessage = `
      INSERT INTO messages (workspace_id, admin_id, conversation_id, message, send_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
      `;
      const messageParameters = [
        snoozeRequest.workspaceId,
        snoozeRequest.adminId,
        snoozeRequest.conversationId,
        message.message,
        message.sendDate,
      ];

      try {
        const response = await pool.query(insertMessage, messageParameters);
        const messageGUID = response.rows[0].id;
        messageLogger.debug(`Message saved with GUID: ${messageGUID}`);

        return messageGUID;
      } catch (err) {
        messageLogger.error(`Error executing insert message query ${err}`);

        return '';
      }
    }
  );

  try {
    messageGUIDs = await Promise.all(promises);
  } catch (err) {
    messageLogger.error(`Error saving messages: ${err}`);
  }

  return messageGUIDs;
};

export { deleteMessage, deleteMessages, getMessage, saveMessage };
