import { RequestHandler } from 'express';
import logger from '../config/logger-config';
import * as canvasService from '../services/canvas-service';
import * as intercomService from '../services/intercom-service';
import * as messageService from '../services/message-service';
import createSnoozeRequest from '../utilities/snooze-utility';

const submitLogger = logger.child({ module: 'submit-controller' });

// POST: /submit - Send the next canvas based on submit component id.
const submit: RequestHandler = async (req, res, next) => {
  submitLogger.info('Submit request received.');
  submitLogger.info(`Request type: ${req.body.component_id}`);
  submitLogger.debug(`POST request body: ${JSON.stringify(req.body)}`);
  if (req.body.component_id === 'submitNumOfSnoozes') {
    let messageCanvas;
    const requestedNumOfSnoozes = req.body?.input_values?.numOfSnoozes;
    // Check if the input is a valid number.
    if (isNaN(requestedNumOfSnoozes)) {
      submitLogger.error(
        `Invalid input. The number of snoozes must be a number. Received: ${requestedNumOfSnoozes}`
      );
      res
        .status(400)
        .send(
          `Invalid input. The number of snoozes must be a number. Received: ${requestedNumOfSnoozes}`
        );
      return;
    } else {
      submitLogger.info('Building message canvas.');
      try {
        const numOfSnoozes = Number(requestedNumOfSnoozes);
        submitLogger.info(`Number of snoozes requested: ${numOfSnoozes}`);
        messageCanvas = canvasService.getMessageCanvas(numOfSnoozes);
      } catch (err) {
        submitLogger.error(
          `An error occurred building the message canvas: ${err}`
        );
        res
          .status(500)
          .send(`An error occurred building the message canvas: ${err}`);
        next(err);
      }
      submitLogger.debug('Completed message canvas.');
      submitLogger.debug(`Message canvas: ${JSON.stringify(messageCanvas)}`);
    }
    // Send the completed message canvas.
    res.send(messageCanvas);
  } else if (req.body.component_id == 'submitSnooze') {
    try {
      submitLogger.info('Parsing request for snooze request.');
      const snoozeRequest = createSnoozeRequest(req.body);
      submitLogger.info('Snooze request created.');

      submitLogger.info('Building final canvas.');
      // Populate finalCanvas with summary of set snoozes.
      const finalCanvas = canvasService.getFinalCanvas(snoozeRequest);
      submitLogger.info('Completed final canvas.');
      submitLogger.debug(`Final canvas: ${JSON.stringify(finalCanvas)}`);

      submitLogger.info('Adding snooze summary note to conversation.');
      // Add note to conversation with summary of set snoozes.
      const noteResponse = await intercomService.addNote({
        adminId: snoozeRequest.adminId,
        conversationId: snoozeRequest.conversationId,
        note: snoozeRequest.note,
      });
      submitLogger.info('Snooze summary note added to conversation.');
      submitLogger.debug(`Add Note response: ${JSON.stringify(noteResponse)}`);

      submitLogger.info('Setting conversation snooze.');
      const snoozeResponse = await intercomService.setSnooze(snoozeRequest);
      submitLogger.info('Conversation snooze set.');
      submitLogger.debug(
        `Set Snooze response: ${JSON.stringify(snoozeResponse)}`
      );

      submitLogger.info('Saving messages to the database.');
      // Save messages to the database.
      const messageResponse = await messageService.saveMessage(snoozeRequest);
      submitLogger.info('Messages saved to the database.');
      submitLogger.debug(
        `Save Messages response: ${JSON.stringify(messageResponse)}`
      );

      // Send the final canvas.
      res.send(finalCanvas);
    } catch (err) {
      submitLogger.error(`An error occurred building the final canvas: ${err}`);
      res
        .status(500)
        .send(`An error occurred building the final canvas: ${err}`);
      next(err);
    }
  } else {
    // Reset to original canvas.
    const initialCanvas = canvasService.getInitialCanvas();
    res.send(initialCanvas);
  }
};

export { submit };
