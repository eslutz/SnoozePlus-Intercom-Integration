import bodyParser from 'body-parser';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import * as CanvasService from './services/canvas-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8706;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));
app.use(express.static(path.join(__dirname)));

const listener = app.listen(PORT, (err) => {
  if (!err) {
    console.log('*** SnoozePlus Intercom Integration ***');
    console.log('Express server is running');
    console.log(`Your app is ready at port: ${listener.address().port}`);
  } else {
    console.error("Error occurred, server can't start", err);
  }
});

app.get('/', (req, res) => {
  console.log('GET request:', req);
  res.status(200).send('Snooze+ is active.');
});

/*
  This is an endpoint that Intercom will POST HTTP request when a teammate inserts
  the app into the inbox, or a new conversation is viewed.
*/
app.post('/initialize', (req, res) => {
  console.log('Initialize request received.');
  console.log('Request body:', req.body);
  const initialCanvas = CanvasService.getInitialCanvas();
  console.log('Initial canvas', JSON.stringify(initialCanvas));

  res.send(initialCanvas);
});

/*
  When a submit action is taken in a canvas component, it will hit this endpoint.

  You can use this endpoint as many times as needed within a flow. You will need
  to set up the conditions that will show it the required canvas object based on a
  teammate's actions.
*/
app.post('/submit', (req, res) => {
  const initialCanvas = CanvasService.getInitialCanvas();
  console.log('Submit request received.');
  console.log('Request type:', req.body.component_id);
  console.log('Request input values:', req.body.input_values);
  if (req.body.component_id === 'submitNumOfSnoozes') {
    let messageCanvas;
    console.log('Building message canvas.');
    try {
      const numOfSnoozes = req.body?.input_values?.numOfSnoozes;
      console.log('Number of snoozes requested:', numOfSnoozes);
      messageCanvas = CanvasService.getMessageCanvas(numOfSnoozes);
    } catch (err) {
      console.error('An error ocurred building the message canvas:', err);
    }
    console.log('Completed message canvas', JSON.stringify(messageCanvas));

    // Send the completed message canvas.
    res.send(messageCanvas);
  } else if (req.body.component_id == 'submitSnooze') {
    let finalCanvas;
    console.log('Building final canvas.');
    try {
      const firstSnoozeLength = req.body.input_values?.snoozeLength1;
      const firstMessage = req.body.input_values?.message1;
      finalCanvas = CanvasService.getFinalCanvas(
        firstSnoozeLength,
        firstMessage
      );
    } catch (err) {
      console.error('An error ocurred building the final canvas:', err);
    }
    console.log('Completed final canvas', JSON.stringify(finalCanvas));

    // Send the final canvas.
    res.send(finalCanvas);
  } else {
    // Reset to original canvas.
    res.send(initialCanvas);
  }
});
