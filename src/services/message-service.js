'use strict';

const db = require('../config/db-config');
const logger = require('../config/logger-config');

const deleteMessage = async () => {
  throw new Error('Not implemented');
};

const getMessage = async () => {
  throw new Error('Not implemented');
};

const saveMessage = async (message) => {
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
    const response = await db.query(insertMessage, messageValues);
    return response.rows[0].id;
  } catch (err) {
    logger.error(`Error executing insert message query ${err}`);
  }

  throw new Error('Not implemented');
};

module.exports = { deleteMessage, getMessage, saveMessage };
