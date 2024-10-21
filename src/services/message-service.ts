import pool from '../config/db-config';
import logger from '../config/logger-config';

// TODO: Implement deleteMessage
const deleteMessage = async () => {
  throw new Error('Not implemented');
};

const getMessage = async (messageGUID: string): Promise<MessageOutbound> => {
  const selectMessage = `
    SELECT * FROM messages
    WHERE id = $1;
  `;
  const messageId = [messageGUID];

  try {
    const response = await pool.query(selectMessage, messageId);
    const message = response.rows[0] as MessageOutbound;
    logger.debug(`Message retrieved: ${JSON.stringify(response.rows[0])}`);

    return message;
  } catch (err) {
    logger.error(`Error executing select message query ${err}`);

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
      const messageValues = [
        snoozeRequest.workspaceId,
        snoozeRequest.adminId,
        snoozeRequest.conversationId,
        message.message,
        message.sendDate,
      ];

      try {
        const response = await pool.query(insertMessage, messageValues);
        const messageGUID = response.rows[0].id;
        logger.debug(`Message saved with GUID: ${messageGUID}`);

        return messageGUID;
      } catch (err) {
        logger.error(`Error executing insert message query ${err}`);

        return '';
      }
    }
  );

  try {
    messageGUIDs = await Promise.all(promises);
  } catch (err) {
    logger.error(`Error saving messages: ${err}`);
  }

  return messageGUIDs;
};

export { deleteMessage, getMessage, saveMessage };
