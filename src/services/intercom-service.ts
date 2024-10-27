// @ts-expect-error: type not yet defined
const fetch = (...args) =>
  // @ts-expect-error: type not yet defined
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
import logger from '../config/logger-config';
import operation from '../config/retry-config';
import { decrypt } from '../utilities/crypto-utility';

const intercomLogger = logger.child({ module: 'intercom-service' });
const baseUrl = process.env.INTERCOM_URL ?? '';

const addNote = async (
  adminId: number,
  conversationId: number,
  note: string
): Promise<any> => {
  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const response = await fetch(
          `${baseUrl}/conversations/${conversationId}/reply`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.INTERCOM_KEY}`,
              'Content-Type': 'application/json',
              'Intercom-Version': '2.11',
            },
            body: JSON.stringify({
              admin_id: adminId,
              body: note,
              message_type: 'note',
              type: 'admin',
            }),
          }
        );
        intercomLogger.debug(`Add note response: ${JSON.stringify(response)}`);

        if (!response.ok) {
          intercomLogger.error(
            `Response status ${response.status}: Error during add note request`
          );
          resolve(null);
        }

        const data = await response.json();

        resolve(data);
      } catch (err) {
        intercomLogger.error(
          `Error during POST request on attempt ${currentAttempt}: ${err}`
        );
        if (operation.retry(err as Error)) {
          return null;
        }
        reject(operation.mainError());
      }
    });
  });
};

const closeConversation = async (
  adminId: number,
  conversationId: number
): Promise<any> => {
  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const response = await fetch(
          `${baseUrl}/conversations/${conversationId}/parts`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.INTERCOM_KEY}`,
              'Content-Type': 'application/json',
              'Intercom-Version': '2.11',
            },
            body: JSON.stringify({
              admin_id: adminId,
              message_type: 'close',
              type: 'admin',
            }),
          }
        );
        intercomLogger.debug(
          `Close conversation response: ${JSON.stringify(response)}`
        );

        if (!response.ok) {
          intercomLogger.error(
            `Response status ${response.status}: Error during close conversation request`
          );

          resolve(null);
        }

        const data = await response.json();

        resolve(data);
      } catch (err) {
        intercomLogger.error(
          `Error during POST request on attempt ${currentAttempt}: ${err}`
        );
        if (operation.retry(err as Error)) {
          return;
        }
        reject(operation.mainError());
      }
    });
  });
};

const sendMessage = async (message: MessageDTO): Promise<any> => {
  // Decrypt the message before sending it.
  let decryptedMessage: string;
  intercomLogger.info('Decrypting message.');
  intercomLogger.profile('decrypt');
  try {
    decryptedMessage = decrypt(message.message);
  } catch (err) {
    intercomLogger.error(`Error decrypting message: ${err}`);
    throw err;
  }
  intercomLogger.profile('decrypt', {
    level: 'info',
    message: 'Message decrypted.',
  });

  // Send the message to Intercom.
  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const response = await fetch(
          `${baseUrl}/conversations/${message.conversationId}/reply`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.INTERCOM_KEY}`,
              'Content-Type': 'application/json',
              'Intercom-Version': '2.11',
            },
            body: JSON.stringify({
              admin_id: message.adminId,
              body: `<p>${decryptedMessage}</p>`,
              message_type: 'comment',
              type: 'admin',
            }),
          }
        );
        intercomLogger.debug(
          `Send message response: ${JSON.stringify(response)}`
        );

        if (!response.ok) {
          intercomLogger.error(
            `Response status ${response.status}: Error during send reply request`
          );

          resolve(null);
        }

        const data = await response.json();

        resolve(data);
      } catch (err) {
        intercomLogger.error(
          `Error during POST request on attempt ${currentAttempt}: ${err}`
        );
        if (operation.retry(err as Error)) {
          return;
        }
        reject(operation.mainError());
      }
    });
  });
};

const setSnooze = async (
  adminId: number,
  conversationId: number,
  unixTimestamp: number
): Promise<any> => {
  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const response = await fetch(
          `${baseUrl}/conversations/${conversationId}/parts`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.INTERCOM_KEY}`,
              'Content-Type': 'application/json',
              'Intercom-Version': '2.11',
            },
            body: JSON.stringify({
              admin_id: adminId,
              message_type: 'snoozed',
              snoozed_until: unixTimestamp,
            }),
          }
        );
        intercomLogger.debug(
          `Set snooze response: ${JSON.stringify(response)}`
        );

        if (!response.ok) {
          intercomLogger.error(
            `Response status ${response.status}: Error during set snooze request`
          );

          resolve(null);
        }

        const data = await response.json();

        resolve(data);
      } catch (err) {
        intercomLogger.error(
          `Error during POST request on attempt ${currentAttempt}: ${err}`
        );
        if (operation.retry(err as Error)) {
          return;
        }
        reject(operation.mainError());
      }
    });
  });
};

export { addNote, closeConversation, sendMessage, setSnooze };
