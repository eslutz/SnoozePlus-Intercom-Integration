import fetch from 'node-fetch';
import config from '../config/config.js';
import logger from '../config/logger-config.js';
import createRetryOperation from '../config/retry-config.js';
import { IntercomResponse } from '../models/intercom-response-model.js';
import { Message } from '../models/message-model.js';
import { decrypt } from '../utilities/crypto-utility.js';

const intercomLogger = logger.child({ module: 'intercom-service' });

const baseUrl = config.intercomUrl;

const addNote = (
  adminId: number,
  adminAccessToken: string,
  conversationId: number,
  note: string
): Promise<IntercomResponse> => {
  // Decrypt the access token before sending.
  let decryptedAccessToken: string;
  intercomLogger.info('Decrypting access token.');
  intercomLogger.profile('decrypt');
  try {
    decryptedAccessToken = decrypt(adminAccessToken);
  } catch (err) {
    intercomLogger.error(`Error decrypting access token: ${String(err)}`);
    throw err;
  }
  intercomLogger.profile('decrypt', {
    level: 'info',
    message: 'Access token decrypted.',
  });

  // Add a note to the conversation.
  return new Promise((resolve, reject) => {
    const operation = createRetryOperation();
    operation.attempt((currentAttempt) => {
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
        fetch(requestUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestBody),
        })
          .then((response) => {
            intercomLogger.debug(
              `Add note response: ${JSON.stringify(response)}`
            );

            if (!response.ok) {
              intercomLogger.error(
                `Response status ${response.status}: Error during add note request.`
              );
              resolve({} as IntercomResponse);
            }

            return response.json();
          })
          .then((data) => {
            resolve(data as IntercomResponse);
          })
          .catch((err: Error) => {
            intercomLogger.error(
              `Error during POST request on attempt ${currentAttempt}: ${err}`
            );
            if (operation.retry(err)) {
              return null;
            }
            reject(operation.mainError()!);
          });
      } catch (err) {
        intercomLogger.error(
          `Error during POST request on attempt ${currentAttempt}: ${String(err)}`
        );
        if (operation.retry(err as Error)) {
          return null;
        }
        reject(operation.mainError()!);
      }
    });
  });
};

const cancelSnooze = (
  adminId: number,
  adminAccessToken: string,
  conversationId: number
): Promise<IntercomResponse> => {
  // Decrypt the access token before sending.
  let decryptedAccessToken: string;
  intercomLogger.info('Decrypting access token.');
  intercomLogger.profile('decrypt');
  try {
    decryptedAccessToken = decrypt(adminAccessToken);
  } catch (err) {
    intercomLogger.error(`Error decrypting access token: ${String(err)}`);
    throw err;
  }
  intercomLogger.profile('decrypt', {
    level: 'info',
    message: 'Access token decrypted.',
  });

  return new Promise((resolve, reject) => {
    const operation = createRetryOperation();
    operation.attempt((currentAttempt) => {
      try {
        fetch(`${baseUrl}/conversations/${conversationId}/parts`, {
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
        })
          .then((response) => {
            intercomLogger.debug(
              `Open conversation response: ${JSON.stringify(response)}`
            );

            if (!response.ok) {
              intercomLogger.error(
                `Response status ${response.status}: Error during cancel snooze request.`
              );

              resolve({} as IntercomResponse);
            }

            return response.json();
          })
          .then((data) => {
            resolve(data as IntercomResponse);
          })
          .catch((err) => {
            intercomLogger.error(
              `Error during POST request on attempt ${currentAttempt}: ${String(err)}`
            );
            if (operation.retry(err as Error)) {
              return;
            }
            reject(operation.mainError()!);
          });
      } catch (err) {
        intercomLogger.error(
          `Error during POST request on attempt ${currentAttempt}: ${String(err)}`
        );
        if (operation.retry(err as Error)) {
          return;
        }
        reject(operation.mainError()!);
      }
    });
  });
};

const closeConversation = (
  adminId: number,
  adminAccessToken: string,
  conversationId: number
): Promise<IntercomResponse> => {
  // Decrypt the access token before sending.
  let decryptedAccessToken: string;
  intercomLogger.info('Decrypting access token.');
  intercomLogger.profile('decrypt');
  try {
    decryptedAccessToken = decrypt(adminAccessToken);
  } catch (err) {
    intercomLogger.error(`Error decrypting access token: ${String(err)}`);
    throw err;
  }
  intercomLogger.profile('decrypt', {
    level: 'info',
    message: 'Access token decrypted.',
  });

  // Close the conversation in Intercom.
  return new Promise((resolve, reject) => {
    const operation = createRetryOperation();
    operation.attempt((currentAttempt) => {
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
        fetch(requestUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestBody),
        })
          .then((response) => {
            intercomLogger.debug(
              `Close conversation response: ${JSON.stringify(response)}`
            );

            if (!response.ok) {
              intercomLogger.error(
                `Response status ${response.status}: Error during close conversation request.`
              );

              resolve({} as IntercomResponse);
            }

            return response.json();
          })
          .then((data) => {
            resolve(data as IntercomResponse);
          })
          .catch((err) => {
            intercomLogger.error(
              `Error during POST request on attempt ${currentAttempt}: ${String(err)}`
            );
            if (operation.retry(err as Error)) {
              return;
            }
            reject(operation.mainError()!);
          });
      } catch (err) {
        intercomLogger.error(
          `Error during POST request on attempt ${currentAttempt}: ${String(err)}`
        );
        if (operation.retry(err as Error)) {
          return;
        }
        reject(operation.mainError()!);
      }
    });
  });
};

const sendMessage = (message: Message): Promise<IntercomResponse> => {
  // Decrypt the message before sending.
  let decryptedMessage: string;
  intercomLogger.info('Decrypting message.');
  intercomLogger.profile('decrypt');
  try {
    decryptedMessage = decrypt(message.message);
  } catch (err) {
    intercomLogger.error(`Error decrypting message: ${String(err)}`);
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
    decryptedAccessToken = decrypt(message.accessToken);
  } catch (err) {
    intercomLogger.error(`Error decrypting access token: ${String(err)}`);
    throw err;
  }
  intercomLogger.profile('decrypt', {
    level: 'info',
    message: 'Access token decrypted.',
  });

  // Send the message to Intercom.
  return new Promise((resolve, reject) => {
    const operation = createRetryOperation();
    operation.attempt((currentAttempt) => {
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
        fetch(requestUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestBody),
        })
          .then((response) => {
            intercomLogger.debug(
              `Send message response: ${JSON.stringify(response)}`
            );

            if (!response.ok) {
              intercomLogger.error(
                `Response status ${response.status}: Error during send reply request.`
              );

              resolve({} as IntercomResponse);
            }

            return response.json();
          })
          .then((data) => {
            resolve(data as IntercomResponse);
          })
          .catch((err: Error) => {
            intercomLogger.error(
              `Error during POST request on attempt ${currentAttempt}: ${err.message}`
            );
            if (operation.retry(err)) {
              return;
            }
            reject(operation.mainError()!);
          });
      } catch (err) {
        intercomLogger.error(
          `Error during POST request on attempt ${currentAttempt}: ${String(err)}`
        );
        if (operation.retry(err as Error)) {
          return;
        }
        reject(operation.mainError()!);
      }
    });
  });
};

const setSnooze = (
  adminId: number,
  adminAccessToken: string,
  conversationId: number,
  unixTimestamp: number
): Promise<IntercomResponse> => {
  // Decrypt the access token before sending.
  let decryptedAccessToken: string;
  intercomLogger.info('Decrypting access token.');
  intercomLogger.profile('decrypt');
  try {
    decryptedAccessToken = decrypt(adminAccessToken);
  } catch (err) {
    intercomLogger.error(`Error decrypting access token: ${String(err)}`);
    throw err;
  }
  intercomLogger.profile('decrypt', {
    level: 'info',
    message: 'Access token decrypted.',
  });

  return new Promise((resolve, reject) => {
    const operation = createRetryOperation();
    operation.attempt((currentAttempt) => {
      try {
        fetch(`${baseUrl}/conversations/${conversationId}/parts`, {
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
        })
          .then((response) => {
            intercomLogger.debug(
              `Set snooze response: ${JSON.stringify(response)}`
            );

            if (!response.ok) {
              intercomLogger.error(
                `Response status ${response.status}: Error during set snooze request.`
              );

              resolve({} as IntercomResponse);
            }

            return response.json();
          })
          .then((data) => {
            resolve(data as IntercomResponse);
          })
          .catch((err: Error) => {
            intercomLogger.error(
              `Error during POST request on attempt ${currentAttempt}: ${err.message}`
            );
            if (operation.retry(err)) {
              return;
            }
            reject(operation.mainError()!);
          });
      } catch (err) {
        intercomLogger.error(
          `Error during POST request on attempt ${currentAttempt}: ${String(err)}`
        );
        if (operation.retry(err as Error)) {
          return;
        }
        reject(operation.mainError()!);
      }
    });
  });
};

export { addNote, cancelSnooze, closeConversation, sendMessage, setSnooze };
