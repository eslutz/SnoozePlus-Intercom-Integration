import bodyParser from 'body-parser';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));
app.use(express.static(path.join(__dirname)));

const listener = app.listen(process.env.PORT, (error) => {
  if (!error) {
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
          id: 'department',
          text: 'This contact works in:',
          align: 'center',
          style: 'header',
        },
        {
          type: 'checkbox',
          id: 'departmentChoice',
          label: '',
          options: [
            {
              type: 'option',
              id: 'butt',
              text: 'Butt',
            },
            {
              type: 'option',
              id: 'operations',
              text: 'Operations',
            },
            {
              type: 'option',
              id: 'it',
              text: 'IT',
            },
          ],
        },
        {
          type: 'button',
          label: 'Snooze',
          style: 'primary',
          id: 'submit_button',
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
              text: 'You said you: ' + department,
              align: 'center',
              style: 'header',
            },
            {
              type: 'button',
              label: 'Submit another',
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
