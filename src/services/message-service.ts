import pool from '../config/db-config';
import logger from '../config/logger-config';

// TODO: Implement deleteMessage
const deleteMessage = async () => {
  throw new Error('Not implemented');
};

// TODO: Implement getMessage
const getMessage = async () => {
  throw new Error('Not implemented');
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

      let messageGUID = '';
      try {
        const response = await pool.query(insertMessage, messageValues);
        messageGUID = response.rows[0].id;
        logger.debug(`Message saved with GUID: ${messageGUID}`);
      } catch (err) {
        logger.error(`Error executing insert message query ${err}`);
      }
      return messageGUID;
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
