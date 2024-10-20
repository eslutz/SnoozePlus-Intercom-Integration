import { QueryArrayResult } from 'pg';
import { query } from '../config/db-config';
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

  snoozeRequest.messages.forEach(async (message) => {
    const insertMessage = `
      INSERT INTO messages (workspace_id, admin_id, conversation_id, message, send_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
      `;
    // TODO: Or ensure message input is sanitized here
    // TODO: Probably need to encrypt data at this point
    const messageValues = [
      snoozeRequest.workspaceId,
      snoozeRequest.adminId,
      snoozeRequest.conversationId,
      message.message,
      message.sendDate,
    ];

    try {
      const response = await query(insertMessage, messageValues);
      const messageGUID = (response.rows[0] as unknown as MessageSaveResponse)
        .id;
      logger.debug(`Message saved with GUID: ${messageGUID}`);
      messageGUIDs.push(messageGUID);
    } catch (err) {
      logger.error(`Error executing insert message query ${err}`);
    }
  });

  return messageGUIDs;
};

export { deleteMessage, getMessage, saveMessage };
