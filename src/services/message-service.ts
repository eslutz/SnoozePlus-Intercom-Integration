import { QueryArrayResult } from 'pg';
import { query } from '../config/db-config';
import logger from '../config/logger-config';

const deleteMessage = async () => {
  throw new Error('Not implemented');
};

const getMessage = async () => {
  throw new Error('Not implemented');
};

const saveMessage = async (snoozeRequest: SnoozeRequest): Promise<string[]> => {
  let messageGUIDs: string[] = [];

  snoozeRequest.messages.forEach(async (message) => {
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
      // TODO: investigate what is actually being returned here.
      const response: QueryArrayResult<string[]> = await query(
        insertMessage,
        messageValues
      );
      messageGUIDs.push(response.rows[0].pop() ?? '');
    } catch (err) {
      logger.error(`Error executing insert message query ${err}`);
    }
  });

  return messageGUIDs;
};

export { deleteMessage, getMessage, saveMessage };
