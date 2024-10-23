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
  submitLogger.profile('submit');
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
      submitLogger.profile('messageCanvas');
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
      submitLogger.profile('messageCanvas', {
        level: 'info',
        message: 'Completed message canvas.',
      });
      submitLogger.debug(`Message canvas: ${JSON.stringify(messageCanvas)}`);
    }
    // Send the completed message canvas.
    res.send(messageCanvas);
  } else if (req.body.component_id == 'submitSnooze') {
    try {
      // Create the snooze request from the input values.
      submitLogger.info('Parsing request for snooze request.');
      submitLogger.profile('createSnoozeRequest');
      const snoozeRequest = createSnoozeRequest(req.body);
      submitLogger.profile('createSnoozeRequest', {
        level: 'info',
        message: 'Snooze request created.',
      });

      // Fill the finalCanvas with a summary of the set snoozes.
      submitLogger.info('Building final canvas.');
      submitLogger.profile('finalCanvas');
      const finalCanvas = canvasService.getFinalCanvas(snoozeRequest);
      submitLogger.profile('finalCanvas', {
        level: 'info',
        message: 'Completed final canvas.',
      });
      submitLogger.debug(`Final canvas: ${JSON.stringify(finalCanvas)}`);

      // Add a note to the conversation with a summary of the set snoozes.
      submitLogger.info('Adding snooze summary note to conversation.');
      submitLogger.profile('addNote');
      const noteResponse = await intercomService.addNote({
        adminId: snoozeRequest.adminId,
        conversationId: snoozeRequest.conversationId,
        note: snoozeRequest.note,
      });
      submitLogger.profile('addNote', {
        level: 'info',
        message: 'Snooze summary note added to conversation.',
      });
      submitLogger.debug(`Add Note response: ${JSON.stringify(noteResponse)}`);

      // Set the conversation snooze.
      submitLogger.info('Setting conversation snooze.');
      submitLogger.profile('setSnooze');
      const snoozeResponse = await intercomService.setSnooze(snoozeRequest);
      submitLogger.profile('setSnooze', {
        level: 'info',
        message: 'Conversation snooze set.',
      });
      submitLogger.debug(
        `Set Snooze response: ${JSON.stringify(snoozeResponse)}`
      );

      // Save messages to the database.
      submitLogger.info('Saving messages to the database.');
      submitLogger.profile('saveMessages');
      const messageResponse = await messageService.saveMessages(
        snoozeRequest.adminId,
        snoozeRequest.conversationId,
        snoozeRequest.messages
      );
      submitLogger.profile('saveMessages', {
        level: 'info',
        message: 'Messages saved to the database.',
      });
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
    submitLogger.info('Resetting to initial canvas.');
    submitLogger.profile('initialCanvas');
    const initialCanvas = canvasService.getInitialCanvas();
    submitLogger.profile('initialCanvas', {
      level: 'info',
      message: 'Completed initial canvas.',
    });
    res.send(initialCanvas);
  }
  submitLogger.profile('submit', {
    level: 'info',
    message: 'Completed submit request.',
  });
};

export { submit };
