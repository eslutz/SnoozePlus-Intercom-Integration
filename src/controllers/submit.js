'use strict';

const canvasService = require('../services/canvas');
const client = require('../services/intercom-client');
const logger = require('../services/logger');

// POST: /submit - Send the next canvas based on submit component id.
const submit = async (req, res, next) => {
  logger.info('Submit request received.');
  logger.info(`Request type: ${req.body.component_id}`);
  logger.debug(`POST request body: ${JSON.stringify(req.body)}`);
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
    try {
      const conversationId = req.body.conversation.id;
      const adminId = req.body.admin.id;
      logger.info('Getting snooze summary.');
      const snoozeSummary = getSnoozeSummary(req.body.input_values);
      logger.info('Retrieved snooze summary.');

      logger.info('Building final canvas.');
      // Populate finalCanvas with summary of set snoozes.
      const finalCanvas = canvasService.getFinalCanvas(snoozeSummary);
      logger.info('Completed final canvas.');
      logger.debug(`Final canvas: ${JSON.stringify(finalCanvas)}`);

      logger.info('Adding snooze summary note to conversation.');
      // Add note to conversation with summary of set snoozes.
      client.addNote(conversationId, adminId, snoozeSummary);
      logger.info('Snooze summary note added to conversation.');

      // Send the final canvas.
      res.send(finalCanvas);
    } catch (err) {
      logger.error(`An error ocurred building the final canvas: ${err}`);
      res
        .status(500)
        .send(`An error ocurred building the final canvas: ${err}`);
      return next(err);
    }
  } else {
    // Reset to original canvas.
    const initialCanvas = canvasService.getInitialCanvas();
    res.send(initialCanvas);
  }
};

// Take the input value object and determine how many snoozes were set.
const getSnoozeSummary = (inputs) => {
  logger.info('Getting number of snoozes set.');
  // Get the keys from the inputs object and use array length property to get number of inputs.
  const keysArray = Object.keys(inputs);
  const keysArrayCount = keysArray.length;
  const snoozeCount = Math.floor(keysArrayCount / 2);
  logger.debug(`Input keys: ${keysArray}`);
  logger.debug(`Input keys count: ${keysArrayCount}`);
  logger.info(`Number of snoozes set: ${snoozeCount}`);

  logger.info('Getting lengths of snoozes.');
  // Get length for each snooze.
  const snoozeLengths = [];
  for (let i = 1; i <= snoozeCount; i++) {
    logger.debug(`Snooze length: ${inputs[`snoozeLength${i}`]}`);
    snoozeLengths.push(inputs[`snoozeLength${i}`]);
  }
  logger.info(`Snooze lengths: ${snoozeLengths.join(', ')}`);

  return { count: snoozeCount, lengths: snoozeLengths };
};

module.exports = { submit };
