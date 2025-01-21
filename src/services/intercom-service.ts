import fetch from 'node-fetch';
import config from '../config/config.js';
import logger from '../config/logger-config.js';
import operation from '../config/retry-config.js';
import { decrypt } from '../utilities/crypto-utility.js';
import { MessageDTO } from '../models/message-dto-model.js';

const intercomLogger = logger.child({ module: 'intercom-service' });

const baseUrl = config.intercomUrl;

const addNote = async (
  adminId: number,
  adminAccessToken: string,
  conversationId: number,
  note: string
): Promise<any> => {
  // Decrypt the access token before sending.
  let decryptedAccessToken: string;
  intercomLogger.info('Decrypting access token.');
  intercomLogger.profile('decrypt');
  try {
    decryptedAccessToken = decrypt(adminAccessToken);
  } catch (err) {
    intercomLogger.error(`Error decrypting access token: ${err}`);
    throw err;
  }
  intercomLogger.profile('decrypt', {
    level: 'info',
    message: 'Access token decrypted.',
  });

  // Add a note to the conversation.
  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const requestUrl = `${baseUrl}/conversations/${conversationId}/reply`;
        const requestBody = {
          admin_id: adminId,
          body: note,
          message_type: 'note',
          type: 'admin',
        };
        const requestHeaders = {
          Authorization: `Bearer ${decryptedAccessToken}`,
          'Content-Type': 'application/json',
          'Intercom-Version': '2.11',
        };

        intercomLogger.debug('Sending add note request', {
          url: requestUrl,
          headers: requestHeaders,
          body: JSON.stringify(requestBody),
        });
        const response = await fetch(requestUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestBody),
        });
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

const cancelSnooze = async (
  adminId: number,
  adminAccessToken: string,
  conversationId: number
): Promise<any> => {
  // Decrypt the access token before sending.
  let decryptedAccessToken: string;
  intercomLogger.info('Decrypting access token.');
  intercomLogger.profile('decrypt');
  try {
    decryptedAccessToken = decrypt(adminAccessToken);
  } catch (err) {
    intercomLogger.error(`Error decrypting access token: ${err}`);
    throw err;
  }
  intercomLogger.profile('decrypt', {
    level: 'info',
    message: 'Access token decrypted.',
  });

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const response = await fetch(
          `${baseUrl}/conversations/${conversationId}/parts`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${decryptedAccessToken}`,
              'Content-Type': 'application/json',
              'Intercom-Version': '2.11',
            },
            body: JSON.stringify({
              admin_id: adminId,
              message_type: 'open',
            }),
          }
        );
        intercomLogger.debug(
          `Open conversation response: ${JSON.stringify(response)}`
        );

        if (!response.ok) {
          intercomLogger.error(
            `Response status ${response.status}: Error during cancel snooze request.`
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

const closeConversation = async (
  adminId: number,
  adminAccessToken: string,
  conversationId: number
): Promise<any> => {
  // Decrypt the access token before sending.
  let decryptedAccessToken: string;
  intercomLogger.info('Decrypting access token.');
  intercomLogger.profile('decrypt');
  try {
    decryptedAccessToken = decrypt(adminAccessToken);
  } catch (err) {
    intercomLogger.error(`Error decrypting access token: ${err}`);
    throw err;
  }
  intercomLogger.profile('decrypt', {
    level: 'info',
    message: 'Access token decrypted.',
  });

  // Close the conversation in Intercom.
  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const requestUrl = `${baseUrl}/conversations/${conversationId}/parts`;
        const requestBody = {
          admin_id: adminId,
          message_type: 'close',
          type: 'admin',
        };
        const requestHeaders = {
          Authorization: `Bearer ${decryptedAccessToken}`,
          'Content-Type': 'application/json',
          'Intercom-Version': '2.11',
        };

        intercomLogger.debug('Sending close conversation request', {
          url: requestUrl,
          headers: requestHeaders,
          body: JSON.stringify(requestBody),
        });
        const response = await fetch(requestUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestBody),
        });
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
  // Decrypt the message before sending.
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

  // Decrypt the access token before sending.
  let decryptedAccessToken: string;
  intercomLogger.info('Decrypting access token.');
  intercomLogger.profile('decrypt');
  try {
    decryptedAccessToken = decrypt(message.adminAccessToken);
  } catch (err) {
    intercomLogger.error(`Error decrypting access token: ${err}`);
    throw err;
  }
  intercomLogger.profile('decrypt', {
    level: 'info',
    message: 'Access token decrypted.',
  });

  // Send the message to Intercom.
  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const requestUrl = `${baseUrl}/conversations/${message.conversationId}/reply`;
        const requestBody = {
          admin_id: message.adminId,
          body: `<p>${decryptedMessage}</p>`,
          message_type: 'comment',
          type: 'admin',
        };
        const requestHeaders = {
          Authorization: `Bearer ${decryptedAccessToken}`,
          'Content-Type': 'application/json',
          'Intercom-Version': '2.11',
        };

        intercomLogger.debug('Sending message request', {
          url: requestUrl,
          headers: requestHeaders,
          body: JSON.stringify(requestBody),
        });
        const response = await fetch(requestUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestBody),
        });
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
  adminAccessToken: string,
  conversationId: number,
  unixTimestamp: number
): Promise<any> => {
  // Decrypt the access token before sending.
  let decryptedAccessToken: string;
  intercomLogger.info('Decrypting access token.');
  intercomLogger.profile('decrypt');
  try {
    decryptedAccessToken = decrypt(adminAccessToken);
  } catch (err) {
    intercomLogger.error(`Error decrypting access token: ${err}`);
    throw err;
  }
  intercomLogger.profile('decrypt', {
    level: 'info',
    message: 'Access token decrypted.',
  });

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const response = await fetch(
          `${baseUrl}/conversations/${conversationId}/parts`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${decryptedAccessToken}`,
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

export { addNote, cancelSnooze, closeConversation, sendMessage, setSnooze };
