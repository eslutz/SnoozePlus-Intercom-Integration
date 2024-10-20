// @ts-expect-error: type not yet defined
const fetch = (...args) =>
  // @ts-expect-error: type not yet defined
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
import logger from '../config/logger-config';
import { setUnixTimestamp } from '../utilities/snooze';

const baseUrl = process.env.INTERCOM_BASE_URL ?? 'https://api.intercom.io';

const addNote = async (snoozeRequest: SnoozeRequest) => {
  try {
    const response = await fetch(
      `${baseUrl}/conversations/${snoozeRequest.conversationId}/reply`,
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
          admin_id: snoozeRequest.adminId,
          body: snoozeRequest.snoozeDetails.snoozeNote,
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

const sendMessage = async (message: MessageOutbound) => {
  try {
    const response = await fetch(
      `${baseUrl}/conversations/${message.conversationId}/reply`,
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
          admin_id: message.adminId,
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

const setSnooze = async (snoozeRequest: SnoozeRequest) => {
  try {
    const response = await fetch(
      `${baseUrl}/conversations/${snoozeRequest.conversationId}/parts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Intercom-Version': '2.11',
          Authorization: `Bearer ${process.env.INTERCOM_API_KEY}`,
        },
        body: JSON.stringify({
          message_type: 'snoozed',
          admin_id: snoozeRequest.adminId,
          snoozed_until: snoozeRequest.snoozeDetails.snoozeUntilUnixTimestamp,
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
