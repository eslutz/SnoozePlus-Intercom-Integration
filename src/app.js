import bodyParser from 'body-parser';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8706;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));
app.use(express.static(path.join(__dirname)));

const listener = app.listen(PORT, (error) => {
  if (!error) {
    console.log('*** SnoozePlus Intercom Integration ***');
    console.log('Express server is running');
    console.log(`Your app is ready at port: ${listener.address().port}`);
  } else {
    console.error("Error occurred, server can't start", error);
  }
});

/*
  This object defines the canvas that will display when your app initializes.
  It includes test, checkboxes, and a button.

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
          id: 'submitNumOfSnooze',
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

app.get('/', (request, response) => {
  console.warn('Index page loaded.');
  console.warn('Request:', request);
  response.sendFile(path.join(__dirname, 'index.html'));
});

/*
  This is an endpoint that Intercom will POST HTTP request when a teammate inserts
  the app into the inbox, or a new conversation is viewed.
*/
app.post('/initialize', (request, response) => {
  console.log('Initialize request received.');
  console.log('Request body:', request.body);
  console.log('Initial canvas', JSON.stringify(initialCanvas));
  response.send(initialCanvas);
});

/*
  When a submit action is taken in a canvas component, it will hit this endpoint.

  You can use this endpoint as many times as needed within a flow. You will need
  to set up the conditions that will show it the required canvas object based on a
  teammate's actions.

  In this example, if a user has clicked the initial submit button, it will show
  them the final submission canvas. If they click the refresh button to submit
  another, it will show the initial canvas once again to repeat the process.
*/
app.post('/submit', (request, response) => {
  console.log('Submit request received.');
  console.log('Request type:', request.body.component_id);
  console.log('Request input values:', request.body.input_values);
  if (request.body.component_id === 'submitNumOfSnooze') {
    console.log('Building message canvas.');
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
    try {
      const numOfSnoozes = request.body.input_values.numOfSnoozes;
      console.log('Number of snoozes requested:', numOfSnoozes);
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
          placeholder: 'Enter message to send at end of snooze...',
        });
        // Insert single-select if only one snooze or last of multiple snoozes.
        // Otherwise, insert a divider.
        if (i < numOfSnoozes) {
          messageCanvas.canvas.content.components.splice(4, 0, {
            type: 'spacer',
            size: 'm',
          });
          messageCanvas.canvas.content.components.splice(5, 0, {
            type: 'divider',
          });
        }
      }
    } catch (error) {
      console.error('An error ocurred building the message canvas:', error);
    }
    console.log('Completed message canvas', JSON.stringify(messageCanvas));
    // Send the completed message canvas.
    response.send(messageCanvas);
  } else if (request.body.component_id == 'submitSnooze') {
    console.log('Building final canvas.');
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
    try {
      const firstSnoozeLength = request.body.input_values.snoozeLength1;
      finalCanvas.canvas.content.components.splice(1, 0, {
        type: 'text',
        text: `Your first message will send in ${firstSnoozeLength} days.`,
        style: 'paragraph',
      });
    } catch (error) {
      console.error('An error ocurred building the final canvas:', error);
    }
    console.log('Completed final canvas', JSON.stringify(finalCanvas));
    // Send the final canvas.
    response.send(finalCanvas);
  } else {
    // Reset to original canvas.
    response.send(initialCanvas);
  }
});
