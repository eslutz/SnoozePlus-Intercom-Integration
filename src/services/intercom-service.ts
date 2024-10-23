// @ts-expect-error: type not yet defined
const fetch = (...args) =>
  // @ts-expect-error: type not yet defined
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
import logger from '../config/logger-config';

const intercomLogger = logger.child({ module: 'intercom-service' });
const baseUrl = process.env.INTERCOM_BASE_URL ?? 'https://api.intercom.io';

const addNote = async (noteRequest: NoteRequest): Promise<any> => {
  try {
    const response = await fetch(
      `${baseUrl}/conversations/${noteRequest.conversationId}/reply`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.INTERCOM_API_KEY}`,
          'Content-Type': 'application/json',
          'Intercom-Version': '2.11',
        },
        body: JSON.stringify({
          admin_id: noteRequest.adminId,
          body: noteRequest.note,
          message_type: 'note',
          type: 'admin',
        }),
      }
    );
    intercomLogger.debug(`Response: ${JSON.stringify(response)}`);

    if (!response.ok) {
      intercomLogger.error(
        `Response status ${response.status}: Error during add note request`
      );

      return null;
    }

    const data = await response.json();

    return data;
  } catch (err) {
    intercomLogger.error(`Error during POST request: ${err}`);

    return null;
  }
};

const closeConversation = async (message: MessageDTO): Promise<any> => {
  try {
    const response = await fetch(
      `${baseUrl}/conversations/${message.conversationId}/parts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.INTERCOM_API_KEY}`,
          'Content-Type': 'application/json',
          'Intercom-Version': '2.11',
        },
        body: JSON.stringify({
          admin_id: message.adminId,
          message_type: 'close',
          type: 'admin',
        }),
      }
    );
    intercomLogger.debug(`Response: ${JSON.stringify(response)}`);

    if (!response.ok) {
      intercomLogger.error(
        `Response status ${response.status}: Error during close conversation request`
      );

      return null;
    }

    const data = await response.json();

    return data;
  } catch (err) {
    intercomLogger.error(`Error during POST request: ${err}`);

    return null;
  }
};

const sendMessage = async (message: MessageDTO): Promise<any> => {
  try {
    const response = await fetch(
      `${baseUrl}/conversations/${message.conversationId}/reply`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.INTERCOM_API_KEY}`,
          'Content-Type': 'application/json',
          'Intercom-Version': '2.11',
        },
        body: JSON.stringify({
          admin_id: message.adminId,
          body: `<p>${message.message}</p>`,
          message_type: 'comment',
          type: 'admin',
        }),
      }
    );
    intercomLogger.debug(`Response: ${JSON.stringify(response)}`);

    if (!response.ok) {
      intercomLogger.error(
        `Response status ${response.status}: Error during send reply request`
      );

      return null;
    }

    const data = await response.json();

    return data;
  } catch (err) {
    intercomLogger.error(`Error during POST request: ${err}`);

    return null;
  }
};

const setSnooze = async (snoozeRequest: SnoozeRequest): Promise<any> => {
  try {
    const response = await fetch(
      `${baseUrl}/conversations/${snoozeRequest.conversationId}/parts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.INTERCOM_API_KEY}`,
          'Content-Type': 'application/json',
          'Intercom-Version': '2.11',
        },
        body: JSON.stringify({
          admin_id: snoozeRequest.adminId,
          message_type: 'snoozed',
          snoozed_until: snoozeRequest.snoozeUntilUnixTimestamp,
        }),
      }
    );
    intercomLogger.debug(`Response: ${JSON.stringify(response)}`);

    if (!response.ok) {
      intercomLogger.error(
        `Response status ${response.status}: Error during set snooze request`
      );

      return null;
    }

    const data = await response.json();

    return data;
  } catch (err) {
    intercomLogger.error(`Error during POST request: ${err}`);

    return null;
  }
};

export { addNote, closeConversation, sendMessage, setSnooze };
