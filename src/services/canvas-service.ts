import logger from '../config/logger-config.js';
import { Message } from '../models/message-model.js';
import { decrypt } from '../utilities/crypto-utility.js';
import { calculateDaysUntilSending } from '../utilities/snooze-utility.js';
import { AppError } from '../middleware/error-middleware.js';

const canvasLogger = logger.child({ module: 'canvas-service' });

/**
 * Creates and returns the initial canvas configuration for the Snooze+ Intercom integration.
 * This canvas is displayed when the app first initializes and presents the user with options
 * to select the number of conversation snoozes.
 *
 * The canvas includes:
 * - A welcome header
 * - Instructional text
 * - A dropdown to select number of snoozes (1-5)
 * - A submit button to proceed
 *
 * @see {@link https://developers.intercom.com/docs/references/canvas-kit/responseobjects/canvas/|Canvas Documentation}
 * @see {@link https://developers.intercom.com/docs/references/canvas-kit/interactivecomponents/button/|Components Documentation}
 *
 * @function getInitialCanvas
 * @returns {Object} An Intercom canvas configuration object containing the initial UI components
 */
const getInitialCanvas = (): object => {
  const initialCanvas = {
    canvas: {
      content: {
        components: [
          {
            type: 'text',
            text: 'Welcome to Snooze+',
            style: 'header',
          },
          {
            type: 'text',
            text: 'To get started, first select how many times you would like to bump the conversation.',
            style: 'muted',
          },
          {
            type: 'spacer',
            size: 's',
          },
          {
            type: 'dropdown',
            id: 'numOfSnoozes',
            label: 'How many snoozes?',
            options: [
              {
                type: 'option',
                id: '1',
                text: '1 snooze 😴',
              },
              {
                type: 'option',
                id: '2',
                text: '2 snoozes 😴😴',
              },
              {
                type: 'option',
                id: '3',
                text: '3 snoozes 😴😴😴',
              },
              {
                type: 'option',
                id: '4',
                text: '4 snoozes 😴😴😴😴',
              },
              {
                type: 'option',
                id: '5',
                text: '5 snoozes 😴😴😴😴😴',
              },
            ],
          },
          {
            type: 'spacer',
            size: 'xl',
          },
          {
            type: 'button',
            id: 'submitNumOfSnoozes',
            label: 'Next >',
            style: 'secondary',
            action: {
              type: 'submit',
            },
          },
        ],
      },
    },
  };

  return initialCanvas;
};

/**
 * Generates a canvas configuration object for the snooze feature interface.
 * The canvas includes dropdown menus for snooze duration and text areas for messages,
 * with the number of input sets determined by the numOfSnoozes parameter.
 * Each set of inputs includes a duration dropdown and message textarea, separated by dividers.
 * The canvas also includes a final action selector and submit button.
 *
 * @function getSetSnoozeCanvas
 * @param numOfSnoozes The number of sequential snooze periods to configure
 * @returns {Object} A canvas configuration object containing the complete interface structure
 */
const getSetSnoozeCanvas = (numOfSnoozes: number): object => {
  const setSnoozeCanvas = {
    canvas: {
      content: {
        components: [
          {
            type: 'text',
            text: 'Set Messages',
            style: 'header',
          },
          {
            type: 'spacer',
            size: 's',
          },
          {
            type: 'single-select',
            id: 'then',
            label: 'Then:',
            options: [
              {
                type: 'option',
                id: 'open',
                text: 'Open conversation',
              },
              {
                type: 'option',
                id: 'close',
                text: 'Close conversation',
              },
            ],
          },
          {
            type: 'spacer',
            size: 'xl',
          },
          {
            type: 'button',
            id: 'submitSnooze',
            label: 'Start Snoozing 😴',
            style: 'primary',
            action: {
              type: 'submit',
            },
          },
        ],
      },
    },
  };

  // Build the canvas component array based on the number of snoozes selected.
  for (let i = numOfSnoozes; i >= 1; i--) {
    setSnoozeCanvas.canvas.content.components.splice(2, 0, {
      type: 'dropdown',
      id: `snoozeDuration${i}`,
      label: 'Snooze for:',
      options: [
        {
          type: 'option',
          id: '1',
          text: '1 day',
        },
        {
          type: 'option',
          id: '2',
          text: '2 days',
        },
        {
          type: 'option',
          id: '3',
          text: '3 days',
        },
        {
          type: 'option',
          id: '4',
          text: '4 days',
        },
        {
          type: 'option',
          id: '5',
          text: '5 days',
        },
        {
          type: 'option',
          id: '6',
          text: '6 days',
        },
        {
          type: 'option',
          id: '7',
          text: '1 week',
        },
        {
          type: 'option',
          id: '14',
          text: '2 weeks',
        },
        {
          type: 'option',
          id: '30',
          text: '1 month',
        },
      ],
    });
    setSnoozeCanvas.canvas.content.components.splice(3, 0, {
      type: 'textarea',
      id: `message${i}`,
      label: 'With message:',
      // @ts-expect-error: type not yet defined
      placeholder: 'Enter message to send at end of snooze...',
    });
    // Do not insert a divider if only one snooze or last of multiple snoozes.
    if (i < numOfSnoozes) {
      setSnoozeCanvas.canvas.content.components.splice(4, 0, {
        type: 'spacer',
        size: 'm',
      });
      // @ts-expect-error: type not yet defined
      setSnoozeCanvas.canvas.content.components.splice(5, 0, {
        type: 'divider',
      });
    }
  }

  return setSnoozeCanvas;
};

/**
 * Generates a canvas object displaying current snooze messages in Intercom messenger.
 * The canvas includes the message content, sending date, and a button to cancel snoozes.
 * Messages are displayed in reverse chronological order (newest first).
 *
 * @function getCurrentSnoozesCanvas
 * @param messages Array of Message objects containing encrypted message content and send dates
 * @returns {Object}A canvas object compatible with Intercom messenger format containing formatted message display
 * @throws AppError if message decryption fails or message/date is invalid
 */
const getCurrentSnoozesCanvas = (messages: Message[]): object => {
  const currentSnoozeCanvas = {
    canvas: {
      content: {
        components: [
          {
            type: 'text',
            text: 'Current Snooze Messages',
            style: 'header',
          },
          {
            type: 'spacer',
            size: 'l',
          },
          {
            type: 'spacer',
            size: 'xl',
          },
          {
            type: 'button',
            id: 'cancelSnooze',
            label: 'Cancel Snoozes',
            style: 'primary',
            action: {
              type: 'submit',
            },
          },
        ],
      },
    },
  };

  // Process messages in reverse order so newest are shown first.
  for (let i = messages.length - 1; i >= 0; i--) {
    // Decrypt the message before sending.
    let decryptedMessage: string;
    canvasLogger.debug('Decrypting message.');
    canvasLogger.profile('decrypt');
    try {
      if (!messages[i]?.message) {
        throw new AppError('Message is undefined or null', 400);
      }
      decryptedMessage = decrypt(messages[i]!.message);
    } catch (err) {
      canvasLogger.error(`Error decrypting message: ${String(err)}`);
      throw new AppError('Failed to decrypt message', 500);
    }
    canvasLogger.profile('decrypt', {
      level: 'debug',
      message: 'Message decrypted.',
    });

    if (!messages[i]?.sendDate) {
      throw new AppError('Send date is undefined or null', 400);
    }
    const sendDate = new Date(messages[i]!.sendDate);
    const daysUntilSending = calculateDaysUntilSending(sendDate);
    currentSnoozeCanvas.canvas.content.components.splice(2, 0, {
      type: 'text',
      text: `Message ${i + 1}:`,
      style: 'header',
    });
    currentSnoozeCanvas.canvas.content.components.splice(3, 0, {
      type: 'text',
      text: decryptedMessage,
      style: 'paragraph',
    });
    currentSnoozeCanvas.canvas.content.components.splice(4, 0, {
      type: 'text',
      text: `Sending in ${daysUntilSending} day${daysUntilSending === 1 ? '' : 's'}.`,
      style: 'muted',
    });

    // Insert a spacer between messages.
    if (i < messages.length - 1) {
      currentSnoozeCanvas.canvas.content.components.splice(5, 0, {
        type: 'spacer',
        size: 'm',
      });
      // @ts-expect-error: type not yet defined
      currentSnoozeCanvas.canvas.content.components.splice(6, 0, {
        type: 'divider',
      });
    }
  }

  return currentSnoozeCanvas;
};

/**
 * Generates a canvas object for displaying snoozed messages with their send dates.
 * The canvas includes a header, message details, and a cancel button.
 * Messages are displayed in reverse chronological order (newest first).
 *
 * @function getFinalCanvas
 * @param messages An array of Message objects containing encrypted messages and send dates
 * @returns {Object} A canvas object containing formatted components for display
 * @throws AppError if message decryption fails or message/date is invalid
 */
const getFinalCanvas = (messages: Message[]): object => {
  const finalCanvas = {
    canvas: {
      content: {
        components: [
          {
            type: 'text',
            id: 'thanks',
            text: 'Snooze Submitted!',
            style: 'header',
          },
          {
            type: 'text',
            text: 'The snooze request has been submitted.',
            style: 'paragraph',
          },
          {
            type: 'spacer',
            size: 'l',
          },
          {
            type: 'spacer',
            size: 'xl',
          },
          {
            type: 'button',
            id: 'cancelSnooze',
            label: 'Cancel Snoozes',
            style: 'primary',
            action: {
              type: 'submit',
            },
          },
        ],
      },
    },
  };

  // Process messages in reverse order so newest are shown first
  for (let i = messages.length - 1; i >= 0; i--) {
    // Decrypt the message before sending.
    let decryptedMessage: string;
    canvasLogger.debug('Decrypting message.');
    canvasLogger.profile('decrypt');
    try {
      if (!messages[i]?.message) {
        throw new AppError('Message is undefined or null', 400);
      }
      decryptedMessage = decrypt(messages[i]!.message);
    } catch (err) {
      canvasLogger.error(`Error decrypting message: ${String(err)}`);
      throw new AppError('Failed to decrypt message', 500);
    }
    canvasLogger.profile('decrypt', {
      level: 'debug',
      message: 'Message decrypted.',
    });

    if (!messages[i]?.sendDate) {
      throw new AppError('Send date is undefined or null', 400);
    }
    const sendDate = new Date(messages[i]!.sendDate);
    const daysUntilSending = calculateDaysUntilSending(sendDate);
    finalCanvas.canvas.content.components.splice(3, 0, {
      type: 'text',
      text: `Message ${i + 1}:`,
      style: 'header',
    });
    finalCanvas.canvas.content.components.splice(4, 0, {
      type: 'text',
      text: decryptedMessage,
      style: 'paragraph',
    });
    finalCanvas.canvas.content.components.splice(5, 0, {
      type: 'text',
      text: `Sending in ${daysUntilSending} day${daysUntilSending === 1 ? '' : 's'}.`,
      style: 'muted',
    });

    // Insert a spacer between messages.
    if (i < messages.length - 1) {
      finalCanvas.canvas.content.components.splice(6, 0, {
        type: 'spacer',
        size: 'm',
      });
      // @ts-expect-error: type not yet defined
      finalCanvas.canvas.content.components.splice(7, 0, {
        type: 'divider',
      });
    }
  }

  return finalCanvas;
};

export {
  getCurrentSnoozesCanvas,
  getInitialCanvas,
  getSetSnoozeCanvas,
  getFinalCanvas,
};
