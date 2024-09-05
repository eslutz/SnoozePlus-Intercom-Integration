'use strict';

const canvasService = require('../services/canvas');
const logger = require('../services/logger');

// POST: /submit - Send the next canvas based on submit component id.
const submit = async (req, res, next) => {
  logger.info('Submit request received.');
  logger.info(`Request type: ${req.body.component_id}`);
  logger.debug(
    `Request input values: ${JSON.stringify(req.body.input_values)}`
  );
  if (req.body.component_id === 'submitNumOfSnoozes') {
    let messageCanvas;
    const requestedNumOfSnoozes = req.body?.input_values?.numOfSnoozes;
    // Check if the input is a valid number.
    if (isNaN(requestedNumOfSnoozes)) {
      logger.error(
        `Invalid input. The number of snoozes must be a number. Received: ${requestedNumOfSnoozes}`
      );
      res
        .status(400)
        .send(
          `Invalid input. The number of snoozes must be a number. Received: ${requestedNumOfSnoozes}`
        );
      return;
    } else {
      logger.info('Building message canvas.');
      try {
        const numOfSnoozes = Number(requestedNumOfSnoozes);
        logger.info(`Number of snoozes requested: ${numOfSnoozes}`);
        messageCanvas = canvasService.getMessageCanvas(numOfSnoozes);
      } catch (err) {
        logger.error(`An error ocurred building the message canvas: ${err}`);
        res
          .status(500)
          .send(`An error ocurred building the message canvas: ${err}`);
        return next(err);
      }
      logger.debug('Completed message canvas.');
      logger.debug(`Message canvas: ${JSON.stringify(messageCanvas)}`);
    }
    // Send the completed message canvas.
    res.send(messageCanvas);
  } else if (req.body.component_id == 'submitSnooze') {
    const firstSnoozeLength = req.body.input_values?.snoozeLength1;
    const firstMessage = req.body.input_values?.message1;
    let finalCanvas;
    logger.info('Building final canvas.');
    try {
      finalCanvas = canvasService.getFinalCanvas(
        firstSnoozeLength,
        firstMessage
      );
    } catch (err) {
      logger.error(`An error ocurred building the final canvas: ${err}`);
      res
        .status(500)
        .send(`An error ocurred building the final canvas: ${err}`);
      return next(err);
    }
    logger.info('Completed final canvas.');
    logger.debug(`Final canvas: ${JSON.stringify(finalCanvas)}`);
    // Send the final canvas.
    res.send(finalCanvas);
  } else {
    // Reset to original canvas.
    const initialCanvas = canvasService.getInitialCanvas();
    res.send(initialCanvas);
  }
};

module.exports = { submit };
