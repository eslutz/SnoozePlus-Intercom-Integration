import { query } from '../config/db-config';
import logger from '../config/logger-config';

const deleteMessage = async () => {
  throw new Error('Not implemented');
};

const getMessage = async () => {
  throw new Error('Not implemented');
};

const saveMessage = async (message: any) => {
  const insertMessage = `
    INSERT INTO messages (workspace_id, admin_id, conversation_id, message, send_date)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id;
    `;
  const messageValues = [
    message.workspaceId,
    message.adminId,
    message.conversationId,
    message.message,
    message.sendDate,
  ];

  try {
    // TODO: update to return ID of created message
    const response = await query(insertMessage, messageValues);
    // return response.rows[0]!.id;
    return response.rows[0];
  } catch (err) {
    logger.error(`Error executing insert message query ${err}`);
  }
};

export { deleteMessage, getMessage, saveMessage };
