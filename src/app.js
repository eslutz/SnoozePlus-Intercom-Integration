import bodyParser from 'body-parser';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));
app.use(express.static(path.join(__dirname)));

const listener = app.listen(PORT, (error) => {
  if (!error) {
    console.log('Express server is running');
    console.log('*** SnoozePlus Intercom Integration ***');
    console.log(`Your app is ready at: ${listener.address().port}`);
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
          id: 'num_of_snoozes',
          label: 'How many snoozes?',
          options: [
            {
              type: 'option',
              id: 'one_snooze',
              text: '1 snooze 😴',
            },
            {
              type: 'option',
              id: 'two_snooze',
              text: '2 snoozes 😴😴',
            },
            {
              type: 'option',
              id: 'three_snooze',
              text: '3 snoozes 😴😴😴',
            },
            {
              type: 'option',
              id: 'four_snooze',
              text: '4 snoozes 😴😴😴😴',
            },
            {
              type: 'option',
              id: 'five_snooze',
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
          id: 'submit_num_of_snooze',
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

app.get('/', (response) => {
  response.sendFile(path.join(__dirname, 'index.html'));
});

/*
  This is an endpoint that Intercom will POST HTTP request when a teammate inserts
  the app into the inbox, or a new conversation is viewed.
*/
app.post('/initialize', (request, response) => {
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
  if (request.body.component_id == 'submit_button') {
    let department = request.body.input_values.departmentChoice;

    let finalCanvas = {
      canvas: {
        content: {
          components: [
            {
              type: 'text',
              id: 'thanks',
              text: 'You submitted: ' + department,
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
    response.send(finalCanvas);
  } else {
    response.send(initialCanvas);
  }
});
