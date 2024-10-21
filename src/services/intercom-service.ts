// @ts-expect-error: type not yet defined
const fetch = (...args) =>
  // @ts-expect-error: type not yet defined
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
import logger from '../config/logger-config';

const baseUrl = process.env.INTERCOM_BASE_URL ?? 'https://api.intercom.io';

const addNote = async (snoozeRequest: SnoozeRequest): Promise<any> => {
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
      logger.error(
        `Response status ${response.status}: Error during add note request`
      );
      logger.debug(`Response: ${JSON.stringify(response)}`);
      return null;
    }
    const data = await response.json();

    return data;
  } catch (err) {
    logger.error(`Error during POST request: ${err}`);
    return null;
  }
};

const sendMessage = async (message: MessageOutbound): Promise<any> => {
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
      logger.error(
        `Response status ${response.status}: Error during send reply request`
      );
      logger.debug(`Response: ${JSON.stringify(response)}`);
    }
    const data = await response.json();

    return data;
  } catch (err) {
    logger.error(`Error during POST request: ${err}`);
  }
};

const setSnooze = async (snoozeRequest: SnoozeRequest): Promise<any> => {
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
      logger.error(
        `Response status ${response.status}: Error during set snooze request`
      );
      logger.debug(`Response: ${JSON.stringify(response)}`);
    }
    const data = await response.json();

    return data;
  } catch (err) {
    logger.error(`Error during POST request: ${err}`);
    return null;
  }
};

export { addNote, sendMessage, setSnooze };
