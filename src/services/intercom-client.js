'use strict';

const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const logger = require('./logger');
const baseUrl = 'https://api.intercom.io';

const addNote = async (conversationId, adminId, snoozeSummary) => {
  try {
    const response = await fetch(
      `${baseUrl}/conversations/${conversationId}/reply`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Intercom-Version': '2.11',
          Authorization: `Bearer ${process.env.INTERCOM_API_KEY}`,
        },
        body: JSON.stringify({
          message_type: 'note',
          type: 'admin',
          admin_id: adminId,
          body: `<p><strong>Snooze+ has been set.</strong></p><p>A total of ${snoozeSummary.count} snoozes has been set.</p><p>The conversation will be snoozed for ${formatLengths(snoozeSummary.lengths)} days.</p>`,
        }),
      }
    );

    if (response.ok) {
      logger.debug(`Response headers: ${response.headers}`);
      const data = await response.json();
      logger.debug(data);
    } else {
      logger.error(`Response status: ${response.status}`);
      logger.error(`Response headers: ${response.headers}`);
      const data = await response.json();
      logger.error(data);
    }
  } catch (err) {
    logger.error(`Error during POST request: ${err}`);
  }
};

const deleteScheduledMessage = async () => {};

const setScheduledMessage = async () => {};

const setSnooze = async () => {};

const formatLengths = (lengths) => {
  if (lengths.length <= 2) return lengths.join(' and ');
  return (
    lengths.slice(0, -1).join(', ') + ', and ' + lengths[lengths.length - 1]
  );
};

module.exports = {
  addNote,
  deleteScheduledMessage,
  setScheduledMessage,
  setSnooze,
};
