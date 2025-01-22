import fetch from 'node-fetch';
import config from '../config/config.js';
import logger from '../config/logger-config.js';
import createRetryOperation from '../config/retry-config.js';
import { IntercomResponse } from '../models/intercom-response-model.js';
import { Message } from '../models/message-model.js';
import { decrypt } from '../utilities/crypto-utility.js';

const intercomLogger = logger.child({ module: 'intercom-service' });

const baseUrl = config.intercomUrl;

/**
 * Adds a note to an Intercom conversation.
 *
 * @function addNote
 * @param adminId The ID of the admin adding the note
 * @param adminAccessToken The encrypted access token for authentication
 * @param conversationId The ID of the conversation to add the note to
 * @param note The content of the note to be added
 * @returns {Promise<IntercomResponse>} A Promise that resolves to an IntercomResponse object
 * @throws Will throw an error if access token decryption fails
 * @throws Error if the request fails after all retry attempts
 */
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

/**
 * Cancels the snooze status for a conversation in Intercom by making it open.
 *
 * @function cancelSnooze
 * @param adminId The ID of the admin performing the action
 * @param adminAccessToken The encrypted access token for authentication
 * @param conversationId The ID of the conversation to unsnooze
 * @returns {Promise<IntercomResponse>} Promise that resolves to an IntercomResponse object
 * @throws Error if access token decryption fails
 * @throws Error if the request fails after all retry attempts
 */
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

/**
 * Closes a conversation in Intercom using the provided admin credentials and conversation ID.
 *
 * @function closeConversation
 * @param adminId The ID of the admin closing the conversation
 * @param adminAccessToken The encrypted access token for admin authentication
 * @param conversationId The ID of the conversation to close
 * @returns {Promise<IntercomResponse>} A Promise that resolves to an IntercomResponse object
 * @throws Will throw an error if access token decryption fails
 * @throws Will throw an error if the request fails after all retry attempts
 */
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

/**
 * Sends a message to Intercom's conversation API endpoint.
 *
 * @function sendMessage
 * @param message The message object containing encrypted message content and credentials
 * @param message.message Encrypted message content to be sent
 * @param message.accessToken Encrypted access token for authentication
 * @param message.conversationId ID of the Intercom conversation to reply to
 * @param message.adminId ID of the admin sending the message
 * @returns {Promise<IntercomResponse>} Resolves with Intercom's API response
 * @throws Will throw an error if message decryption fails
 * @throws Will throw an error if access token decryption fails
 * @throws Will throw an error if the request fails after all retry attempts
 */
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

/**
 * Sets a snooze time for an Intercom conversation.
 *
 * @function setSnooze
 * @param adminId The ID of the admin setting the snooze
 * @param adminAccessToken The encrypted access token for authentication
 * @param conversationId The ID of the conversation to be snoozed
 * @param unixTimestamp The Unix timestamp until when the conversation should be snoozed
 * @returns {Promise<IntercomResponse>} Promise resolving to an IntercomResponse object
 * @throws Will throw an error if token decryption fails
 */
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
