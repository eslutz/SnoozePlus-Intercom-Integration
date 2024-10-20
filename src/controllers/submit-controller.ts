import { RequestHandler } from 'express';
import logger from '../config/logger-config';
import * as canvasService from '../services/canvas-service';
import * as intercomService from '../services/intercom-service';
import * as messageService from '../services/message-service';
import { createSnoozeRequest } from '../utilities/snooze';

// POST: /submit - Send the next canvas based on submit component id.
const submit: RequestHandler = async (req, res, next) => {
  logger.info('Submit request received.');
  logger.info(`Request type: ${req.body.component_id}`);
  logger.debug(`POST request body: ${JSON.stringify(req.body)}`);
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
      logger.info('Parsing request for snooze request.');
      const snoozeRequest = createSnoozeRequest(req.body);
      logger.info('Snooze request created.');

      logger.info('Building final canvas.');
      // Populate finalCanvas with summary of set snoozes.
      const finalCanvas = canvasService.getFinalCanvas(snoozeRequest);
      logger.info('Completed final canvas.');
      logger.debug(`Final canvas: ${JSON.stringify(finalCanvas)}`);

      logger.info('Adding snooze summary note to conversation.');
      // Add note to conversation with summary of set snoozes.
      const noteResponse = await intercomService.addNote(snoozeRequest);
      logger.info('Snooze summary note added to conversation.');
      logger.debug(`Add Note response: ${JSON.stringify(noteResponse)}`);

      logger.info('Setting conversation snooze.');
      const snoozeResponse = await intercomService.setSnooze(snoozeRequest);
      logger.info('Conversation snooze set.');
      logger.debug(`Set Snooze response: ${JSON.stringify(snoozeResponse)}`);

      logger.info('Saving messages to the database.');
      // Save messages to the database.
      const messageResponse = await messageService.saveMessage(snoozeRequest);
      logger.debug(`Save Messages response: ${messageResponse}`);

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

export { submit };
