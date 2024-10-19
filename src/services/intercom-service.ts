// @ts-expect-error: type not yet defined
const fetch = (...args) =>
  // @ts-expect-error: type not yet defined
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
import logger from '../config/logger-config';

const baseUrl = process.env.INTERCOM_BASE_URL ?? 'https://api.intercom.io';

const addNote = async (
  conversationId: number,
  adminId: number,
  snoozeRequest: any
) => {
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
          body: `<p><strong>Snooze+ has been set.</strong></p><p>The conversation will be snoozed for ${snoozeRequest.length} days and will stop snoozing on ${snoozeRequest.until.toLocaleDateString()}.</p>`,
        }),
      }
    );

    if (!response.ok) {
      logger.error('Error during add note request');
      logger.error(`Response status: ${response.status}`);
      logger.error(`Response headers: ${response.headers}`);
    }
    const data = await response.json();

    return data;
  } catch (err) {
    logger.error(`Error during POST request: ${err}`);
  }
};

const sendMessage = async (
  conversationId: number,
  adminId: number,
  message: any
) => {
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
          message_type: 'comment',
          type: 'admin',
          admin_id: adminId,
          body: `<p>${message.message}</p>`,
        }),
      }
    );

    if (!response.ok) {
      logger.error('Error during send reply request');
      logger.error(`Response status: ${response.status}`);
      logger.error(`Response headers: ${response.headers}`);
    }
    const data = await response.json();

    return data;
  } catch (err) {
    logger.error(`Error during POST request: ${err}`);
  }
};

const setSnooze = async (
  conversationId: number,
  adminId: number,
  snoozeUntil: Date
) => {
  // Convert snoozeUntil to Unix timestamp.
  const snoozeUntilUnixTimestamp = Math.floor(
    new Date(snoozeUntil).getTime() / 1000
  );

  try {
    const response = await fetch(
      `${baseUrl}/conversations/${conversationId}/parts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Intercom-Version': '2.11',
          Authorization: `Bearer ${process.env.INTERCOM_API_KEY}`,
        },
        body: JSON.stringify({
          message_type: 'snoozed',
          admin_id: adminId,
          snoozed_until: snoozeUntilUnixTimestamp,
        }),
      }
    );

    if (!response.ok) {
      logger.error('Error during send reply request');
      logger.error(`Response status: ${response.status}`);
      logger.error(`Response headers: ${response.headers}`);
    }
    const data = await response.json();

    return data;
  } catch (err) {
    logger.error(`Error during POST request: ${err}`);
  }
};

export { addNote, sendMessage, setSnooze };
