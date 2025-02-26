import { RequestHandler } from 'express';
import logger from '../config/logger-config.js';
import * as canvasService from '../services/canvas-service.js';
import { getMessages } from '../services/message-db-service.js';
import { IntercomCanvasRequest } from '../models/intercom-request-canvas-model.js';

const initializeLogger = logger.child({ module: 'initialize-controller' });

// POST: /initialize - Send the initial canvas.
const initialize: RequestHandler = async (req, res, next) => {
  initializeLogger.info('Initialize request received.');
  initializeLogger.profile('initialize');
  initializeLogger.debug(`POST request body: ${JSON.stringify(req.body)}`);

  const canvasRequest = req.body as IntercomCanvasRequest;
  const workspaceId = canvasRequest.workspace_id;
  initializeLogger.debug(`workspace_id: ${workspaceId}`);
  const conversationId = canvasRequest.conversation?.id;
  initializeLogger.debug(`conversation_id: ${conversationId}`);

  if (conversationId !== undefined) {
    // Get all messages for the conversation that are not archived, sorted by send_date.
    const messages = await getMessages(workspaceId, Number(conversationId));
    if (messages.length > 0) {
      try {
        initializeLogger.info(
          'Messages found. Building current snoozes canvas.'
        );
        initializeLogger.profile('currentSnoozesCanvas');
        const currentSnoozesCanvas =
          canvasService.getCurrentSnoozesCanvas(messages);
        initializeLogger.profile('currentSnoozesCanvas', {
          level: 'info',
          message: 'Completed current snoozes canvas.',
        });
        initializeLogger.debug(
          `Current snoozes canvas: ${JSON.stringify(currentSnoozesCanvas)}`
        );
        res.send(currentSnoozesCanvas);
        return; // Return early if messages are found and response is sent.
      } catch (err) {
        initializeLogger.error(
          `An error occurred with the current snoozes canvas: ${String(err)}`
        );
        res
          .status(500)
          .send(
            `An error occurred with the current snoozes canvas: ${String(err)}`
          );
        next(err);
        return; // Return early if an error occurs.
      }
    }
  }

  // If no messages are found, build the initial canvas.
  try {
    initializeLogger.info('No messages found. Building initial canvas.');
    initializeLogger.profile('initialCanvas');
    const initialCanvas = canvasService.getInitialCanvas();
    initializeLogger.profile('initialCanvas', {
      level: 'info',
      message: 'Completed initial canvas.',
    });
    initializeLogger.debug(`Initial canvas: ${JSON.stringify(initialCanvas)}`);
    res.send(initialCanvas);
  } catch (err) {
    initializeLogger.error(
      `An error occurred with the initialize canvas: ${String(err)}`
    );
    res
      .status(500)
      .send(`An error occurred with the initialize canvas: ${String(err)}`);
    next(err);
  }
  initializeLogger.profile('initialize', {
    level: 'info',
    message: 'Completed initialize request.',
  });
};

export { initialize };
