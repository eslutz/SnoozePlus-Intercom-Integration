import fetch from 'node-fetch';
import config from '../config/config.js';
import logger from '../config/logger-config.js';
import { retryAsyncOperation } from '../utilities/retry-utility.js';
import { IntercomResponse } from '../models/intercom-response-model.js';
import { Message } from '../models/message-model.js';
import { decrypt } from '../utilities/crypto-utility.js';
import { AppError } from '../middleware/error-middleware.js';

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
 * @throws Will throw an AppError if access token decryption fails or request fails
 */
const addNote = async (
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
    throw new AppError('Failed to decrypt access token', 500);
  }
  intercomLogger.profile('decrypt', {
    level: 'info',
    message: 'Access token decrypted.',
  });

  return retryAsyncOperation<IntercomResponse>(async () => {
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
      throw new AppError(
        `Response status ${response.status}: Error during add note request.`,
        response.status
      );
    }
    return (await response.json()) as IntercomResponse;
  }, 'addNote');
};

/**
 * Cancels the snooze status for a conversation in Intercom by making it open.
 *
 * @function cancelSnooze
 * @param adminId The ID of the admin performing the action
 * @param adminAccessToken The encrypted access token for authentication
 * @param conversationId The ID of the conversation to unsnooze
 * @returns {Promise<IntercomResponse>} Promise that resolves to an IntercomResponse object
 * @throws AppError if access token decryption fails or request fails
 */
const cancelSnooze = async (
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
    throw new AppError('Failed to decrypt access token', 500);
  }
  intercomLogger.profile('decrypt', {
    level: 'info',
    message: 'Access token decrypted.',
  });

  return retryAsyncOperation<IntercomResponse>(async () => {
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
      throw new AppError(
        `Response status ${response.status}: Error during cancel snooze request.`,
        response.status
      );
    }
    return (await response.json()) as IntercomResponse;
  }, 'cancelSnooze');
};

/**
 * Closes a conversation in Intercom using the provided admin credentials and conversation ID.
 *
 * @function closeConversation
 * @param adminId The ID of the admin closing the conversation
 * @param adminAccessToken The encrypted access token for admin authentication
 * @param conversationId The ID of the conversation to close
 * @returns {Promise<IntercomResponse>} A Promise that resolves to an IntercomResponse object
 * @throws AppError if access token decryption fails or request fails
 */
const closeConversation = async (
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
    throw new AppError('Failed to decrypt access token', 500);
  }
  intercomLogger.profile('decrypt', {
    level: 'info',
    message: 'Access token decrypted.',
  });

  return retryAsyncOperation<IntercomResponse>(async () => {
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
      throw new AppError(
        `Response status ${response.status}: Error during close conversation request.`,
        response.status
      );
    }
    return (await response.json()) as IntercomResponse;
  }, 'closeConversation');
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
 * @throws AppError if message decryption fails, access token decryption fails, or request fails
 */
const sendMessage = async (message: Message): Promise<IntercomResponse> => {
  // Decrypt the message before sending.
  let decryptedMessage: string;
  intercomLogger.info('Decrypting message.');
  intercomLogger.profile('decrypt');
  try {
    decryptedMessage = decrypt(message.message);
  } catch (err) {
    intercomLogger.error(`Error decrypting message: ${String(err)}`);
    throw new AppError('Failed to decrypt message', 500);
  }
  intercomLogger.profile('decrypt', {
    level: 'info',
    message: 'Message decrypted.',
  });
  let decryptedAccessToken: string;
  intercomLogger.info('Decrypting access token.');
  intercomLogger.profile('decrypt');
  try {
    decryptedAccessToken = decrypt(message.accessToken);
  } catch (err) {
    intercomLogger.error(`Error decrypting access token: ${String(err)}`);
    throw new AppError('Failed to decrypt access token', 500);
  }
  intercomLogger.profile('decrypt', {
    level: 'info',
    message: 'Access token decrypted.',
  });

  return retryAsyncOperation<IntercomResponse>(async () => {
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
    intercomLogger.debug(`Send message response: ${JSON.stringify(response)}`);
    if (!response.ok) {
      throw new AppError(
        `Response status ${response.status}: Error during send reply request.`,
        response.status
      );
    }
    return (await response.json()) as IntercomResponse;
  }, 'sendMessage');
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
 * @throws AppError if token decryption fails or request fails
 */
const setSnooze = async (
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
    throw new AppError('Failed to decrypt access token', 500);
  }
  intercomLogger.profile('decrypt', {
    level: 'info',
    message: 'Access token decrypted.',
  });

  return retryAsyncOperation<IntercomResponse>(async () => {
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
    intercomLogger.debug(`Set snooze response: ${JSON.stringify(response)}`);
    if (!response.ok) {
      throw new AppError(
        `Response status ${response.status}: Error during set snooze request.`,
        response.status
      );
    }
    return (await response.json()) as IntercomResponse;
  }, 'setSnooze');
};

export { addNote, cancelSnooze, closeConversation, sendMessage, setSnooze };
