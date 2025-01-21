import logger from '../config/logger-config.js';
import { MessageDTO } from '../models/message-dto-model.js';
import { decrypt } from '../utilities/crypto-utility.js';
import { calculateDaysUntilSending } from '../utilities/snooze-utility.js';

const canvasLogger = logger.child({ module: 'canvas-service' });

const getInitialCanvas = () => {
  /*
  This object defines the canvas that will display when your app initializes.

  More information on these can be found in the reference docs.
  Canvas docs: https://developers.intercom.com/docs/references/canvas-kit/responseobjects/canvas/
  Components docs: https://developers.intercom.com/docs/references/canvas-kit/interactivecomponents/button/
*/
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

const getSetSnoozeCanvas = (numOfSnoozes: number) => {
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

const getCurrentSnoozesCanvas = (messages: MessageDTO[]) => {
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
      decryptedMessage = decrypt(messages[i].message);
    } catch (err) {
      canvasLogger.error(`Error decrypting message: ${err}`);
      throw err;
    }
    canvasLogger.profile('decrypt', {
      level: 'debug',
      message: 'Message decrypted.',
    });

    const sendDate = new Date(messages[i].sendDate);
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

const getFinalCanvas = (messages: MessageDTO[]) => {
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
      decryptedMessage = decrypt(messages[i].message);
    } catch (err) {
      canvasLogger.error(`Error decrypting message: ${err}`);
      throw err;
    }
    canvasLogger.profile('decrypt', {
      level: 'debug',
      message: 'Message decrypted.',
    });

    const sendDate = new Date(messages[i].sendDate);
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
