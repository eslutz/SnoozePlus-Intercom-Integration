import bodyParser from 'body-parser';
import express from 'express';
import expressWinston from 'express-winston';
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import * as CanvasService from './services/canvas-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8706;

app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    expressFormat: true,
  })
);

app.use(
  expressWinston.errorLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    expressFormat: true,
  })
);

const logger = winston.createLogger({
  level: 'debug',
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  expressFormat: true,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));
app.use(express.static(path.join(__dirname)));

const listener = app.listen(PORT, (err) => {
  if (!err) {
    logger.info('*** SnoozePlus Intercom Integration ***');
    logger.info('Express server is running');
    logger.info(`Your app is ready at port: ${listener.address().port}`);
  } else {
    logger.error(`Error occurred, server can't start: ${err}`);
  }
});

app.get('/', (req, res) => {
  logger.debug(`GET request: ${JSON.stringify(req)}`);
  res.status(200).send('Snooze+ is active.');
});

/*
  This is an endpoint that Intercom will POST HTTP request when a teammate inserts
  the app into the inbox, or a new conversation is viewed.
*/
app.post('/initialize', (req, res) => {
  logger.info('Initialize request received.');
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);
  const initialCanvas = CanvasService.getInitialCanvas();
  logger.debug(`Initial canvas: ${JSON.stringify(initialCanvas)}`);
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
  logger.info('Submit request received.');
  logger.info(`Request type: ${req.body.component_id}`);
  logger.debug(
    `Request input values: ${JSON.stringify(req.body.input_values)}`
  );
  if (req.body.component_id === 'submitNumOfSnoozes') {
    let messageCanvas;
    logger.info('Building message canvas.');
    try {
      const numOfSnoozes = req.body?.input_values?.numOfSnoozes;
      logger.info(`Number of snoozes requested: ${numOfSnoozes}`);
      messageCanvas = CanvasService.getMessageCanvas(numOfSnoozes);
    } catch (err) {
      logger.error(`An error ocurred building the message canvas: ${err}`);
    }
    logger.debug('Completed message canvas.');
    logger.debug(`Message canvas: ${JSON.stringify(messageCanvas)}`);
    // Send the completed message canvas.
    res.send(messageCanvas);
  } else if (req.body.component_id == 'submitSnooze') {
    let finalCanvas;
    logger.info('Building final canvas.');
    try {
      const firstSnoozeLength = req.body.input_values?.snoozeLength1;
      const firstMessage = req.body.input_values?.message1;
      finalCanvas = CanvasService.getFinalCanvas(
        firstSnoozeLength,
        firstMessage
      );
    } catch (err) {
      logger.error(`An error ocurred building the final canvas: ${err}`);
    }
    logger.info('Completed final canvas.');
    logger.debug(`Final canvas: ${JSON.stringify(finalCanvas)}`);
    // Send the final canvas.
    res.send(finalCanvas);
  } else {
    // Reset to original canvas.
    res.send(initialCanvas);
  }
});
