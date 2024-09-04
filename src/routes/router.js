const express = require('express');
const router = express.Router();
const canvasService = require('../services/canvas');
const logger = require('../services/logger');

router.get('/', (req, res) => {
  try {
    logger.debug(`GET request body: ${JSON.stringify(req.body)}}`);
    res.status(200).send('Snooze+ is active.');
  } catch (err) {
    logger.error(`An error ocurred: ${err}`);
    res.status(500).send(`An error ocurred: ${err}`);
  }
});

/*
  This is an endpoint that Intercom will POST HTTP request when a teammate inserts
  the app into the inbox, or a new conversation is viewed.
*/
router.route('/initialize').post((req, res) => {
  try {
    logger.info('Initialize request received.');
    logger.debug(`Request body: ${JSON.stringify(req.body)}`);
    const initialCanvas = canvasService.getInitialCanvas();
    logger.debug(`Initial canvas: ${JSON.stringify(initialCanvas)}`);
    res.send(initialCanvas);
  } catch (err) {
    logger.error(`An error ocurred with the initialize canvas: ${err}`);
    res.status(500).send(`An error ocurred with the initialize canvas: ${err}`);
  }
});

/*
  When a submit action is taken in a canvas component, it will hit this endpoint.

  You can use this endpoint as many times as needed within a flow. You will need
  to set up the conditions that will show it the required canvas object based on a
  teammate's actions.
*/
router.post('/submit', (req, res) => {
  const initialCanvas = canvasService.getInitialCanvas();
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
      messageCanvas = canvasService.getMessageCanvas(numOfSnoozes);
    } catch (err) {
      logger.error(`An error ocurred building the message canvas: ${err}`);
      res
        .status(500)
        .send(`An error ocurred building the message canvas: ${err}`);
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
      finalCanvas = canvasService.getFinalCanvas(
        firstSnoozeLength,
        firstMessage
      );
    } catch (err) {
      logger.error(`An error ocurred building the final canvas: ${err}`);
      res
        .status(500)
        .send(`An error ocurred building the final canvas: ${err}`);
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

module.exports = router;
