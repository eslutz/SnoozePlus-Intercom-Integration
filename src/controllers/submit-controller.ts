import { RequestHandler, Request, Response } from 'express';
import logger from '../config/logger-config.js';
import * as canvasService from '../services/canvas-service.js';
import * as intercomService from '../services/intercom-service.js';
import * as messageDbService from '../services/message-db-service.js';
import * as workspaceDbService from '../services/user-db-service.js';
import {
  createSnoozeRequest,
  setSnoozeCanceledNote,
} from '../utilities/snooze-utility.js';
import { IntercomCanvasRequest } from '../models/intercom-request-canvas-model.js';
import { asyncHandler, AppError } from '../middleware/error-middleware.js';

const submitLogger = logger.child({ module: 'submit-controller' });

// POST: /submit - Send the next canvas based on submit component id.
const submit: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    submitLogger.info('Submit request received.');
    submitLogger.profile('submit');
    const canvasRequest = req.body as IntercomCanvasRequest;
    submitLogger.info(`Request type: ${canvasRequest.component_id}`);
    submitLogger.debug(`POST request body: ${JSON.stringify(req.body)}`);
    const workspaceId = canvasRequest.workspace_id;
    submitLogger.debug(`workspace_id: ${workspaceId}`);
    const conversationId = Number(canvasRequest.conversation.id);
    submitLogger.debug(`conversation:id: ${conversationId}`);

    // Retrieve user based on workspace_id
    const user = await workspaceDbService.getWorkspace(workspaceId);
    if (!user) {
      throw new AppError(`User not found. Workspace ID: ${workspaceId}`, 404);
    }

    if (canvasRequest.component_id === 'submitNumOfSnoozes') {
      const requestedNumOfSnoozes = canvasRequest.input_values.numOfSnoozes;
      // Check if the input is a valid number.
      if (isNaN(requestedNumOfSnoozes)) {
        throw new AppError(
          `Invalid input. The number of snoozes must be a number. Received: ${requestedNumOfSnoozes}`,
          400
        );
      }

      const numOfSnoozes = Number(requestedNumOfSnoozes);
      submitLogger.info(`Number of snoozes requested: ${numOfSnoozes}`);
      submitLogger.info('Building message canvas.');
      const messageCanvas = canvasService.getSetSnoozeCanvas(numOfSnoozes);
      submitLogger.info('Returning message canvas.');

      res.send(messageCanvas);
    } else if (canvasRequest.component_id === 'submitSnooze') {
      // Create the snooze request from the input values.
      submitLogger.info('Parsing request for snooze request.');
      submitLogger.profile('createSnoozeRequest');
      const snoozeRequest = await createSnoozeRequest(canvasRequest.input_values);
      submitLogger.profile('createSnoozeRequest', {
        level: 'info',
        message: 'Snooze request created.',
      });

      // Save messages to the database.
      submitLogger.info('Saving messages to the database.');
      submitLogger.profile('saveMessages');
      const messageResponse = await messageDbService.saveMessages(
        workspaceId,
        conversationId,
        snoozeRequest.messages
      );
      submitLogger.profile('saveMessages', {
        level: 'info',
        message: 'Messages saved to the database.',
      });
      submitLogger.debug(
        `Save Messages response: ${JSON.stringify(messageResponse)}`
      );

      // Fill the finalCanvas with a summary of the set snoozes.
      submitLogger.info('Building final canvas.');
      submitLogger.profile('finalCanvas');
      const messages = await messageDbService.getMessages(
        workspaceId,
        conversationId
      );
      const finalCanvas = await canvasService.getFinalCanvas(messages);
      submitLogger.profile('finalCanvas', {
        level: 'info',
        message: 'Completed final canvas.',
      });
      submitLogger.debug(`Final canvas: ${JSON.stringify(finalCanvas)}`);

      // Add a note to the conversation with a summary of the set snoozes.
      submitLogger.info('Adding snooze summary note to conversation.');
      submitLogger.profile('addNote');
      const noteResponse = await intercomService.addNote(
        user.adminId,
        user.accessToken,
        conversationId,
        snoozeRequest.note
      );
      submitLogger.profile('addNote', {
        level: 'info',
        message: 'Snooze summary note added to conversation.',
      });
      submitLogger.debug(`Add Note response: ${JSON.stringify(noteResponse)}`);

      // Set the conversation snooze.
      submitLogger.info('Setting conversation snooze.');
      submitLogger.profile('setSnooze');
      const snoozeResponse = await intercomService.setSnooze(
        user.adminId,
        user.accessToken,
        conversationId,
        snoozeRequest.snoozeUntilUnixTimestamp
      );
      submitLogger.profile('setSnooze', {
        level: 'info',
        message: 'Conversation snooze set.',
      });
      submitLogger.debug(
        `Set Snooze response: ${JSON.stringify(snoozeResponse)}`
      );

      // Send the final canvas.
      res.send(finalCanvas);
    } else if (canvasRequest.component_id === 'cancelSnooze') {
      submitLogger.info('Cancel snooze request received.');
      submitLogger.profile('cancelSnooze');

      // Archive messages in the database.
      submitLogger.info('Archiving messages.');
      submitLogger.profile('archiveMessages');
      const messagesArchived = await messageDbService.archiveMessages(
        workspaceId,
        conversationId
      );
      submitLogger.profile('archiveMessages', {
        level: 'info',
        message: `Messages archived: ${messagesArchived}`,
      });
      submitLogger.debug(
        `Messages archived response: ${JSON.stringify(messagesArchived)}`
      );

      // Add cancel snooze note to the conversation.
      submitLogger.info('Adding cancelling snooze note.');
      submitLogger.profile('addNote');
      const cancelSnoozeResponse = await intercomService.addNote(
        user.adminId,
        user.accessToken,
        conversationId,
        setSnoozeCanceledNote(messagesArchived)
      );
      submitLogger.profile('addNote', {
        level: 'info',
        message: 'Cancelling snooze note added.',
      });
      submitLogger.debug(
        `Cancel Snooze response: ${JSON.stringify(cancelSnoozeResponse)}`
      );

      // Cancel the conversation snooze.
      submitLogger.info('Unsnoozing conversation.');
      submitLogger.profile('unsnooze');
      const unsnoozeResponse = await intercomService.cancelSnooze(
        user.adminId,
        user.accessToken,
        conversationId
      );
      submitLogger.profile('unsnooze', {
        level: 'info',
        message: 'Conversation unsnoozed.',
      });
      submitLogger.debug(
        `Unsnooze response: ${JSON.stringify(unsnoozeResponse)}`
      );

      // Reset to original canvas.
      submitLogger.info('Resetting to initial canvas.');
      submitLogger.profile('initialCanvas');
      const initialCanvas = canvasService.getInitialCanvas();
      submitLogger.profile('initialCanvas', {
        level: 'info',
        message: 'Completed cancel snooze request.',
      });

      res.send(initialCanvas);
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
  }
);

export { submit };
