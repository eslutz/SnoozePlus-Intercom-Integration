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

const getMessageCanvas = (numOfSnoozes: number) => {
  const messageCanvas = {
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
                id: 'snooze',
                text: 'Snooze ',
              },
              {
                type: 'option',
                id: 'close',
                text: 'Close',
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
    messageCanvas.canvas.content.components.splice(2, 0, {
      type: 'dropdown',
      id: `snoozeLength${i}`,
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
    messageCanvas.canvas.content.components.splice(3, 0, {
      type: 'textarea',
      id: `message${i}`,
      label: 'With message:',
      // @ts-expect-error: type not yet defined
      placeholder: 'Enter message to send at end of snooze...',
    });
    // Do not insert a divider if only one snooze or last of multiple snoozes.
    if (i < numOfSnoozes) {
      messageCanvas.canvas.content.components.splice(4, 0, {
        type: 'spacer',
        size: 'm',
      });
      // @ts-expect-error: type not yet defined
      messageCanvas.canvas.content.components.splice(5, 0, {
        type: 'divider',
      });
    }
  }

  return messageCanvas;
};

const getFinalCanvas = (snoozeRequest: SnoozeRequest) => {
  const finalCanvas = {
    canvas: {
      content: {
        components: [
          {
            type: 'text',
            id: 'thanks',
            text: 'Snooze Submitted!',
            align: 'center',
            style: 'header',
          },
          {
            type: 'text',
            text: snoozeRequest.note,
            style: 'paragraph',
          },
          {
            type: 'button',
            label: 'Try another?',
            style: 'primary',
            id: 'refresh_button',
            action: {
              type: 'submit',
            },
          },
        ],
      },
    },
  };

  return finalCanvas;
};

export { getInitialCanvas, getMessageCanvas, getFinalCanvas };
