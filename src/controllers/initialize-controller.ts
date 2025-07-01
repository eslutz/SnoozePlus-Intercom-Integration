import { RequestHandler, Request, Response } from 'express';
import logger from '../config/logger-config.js';
import { container } from '../container/container.js';
import { CanvasService } from '../services/canvas-service.js';
import type { IMessageService } from '../container/interfaces.js';
import { TYPES } from '../container/types.js';
import { IntercomCanvasRequest } from '../models/intercom-request-canvas-model.js';
import { asyncHandler } from '../middleware/error-middleware.js';

const initializeLogger = logger.child({ module: 'initialize-controller' });

// POST: /initialize - Send the initial canvas.
const initialize: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    initializeLogger.info('Initialize request received.');
    initializeLogger.profile('initialize');
    initializeLogger.debug(`POST request body: ${JSON.stringify(req.body)}`);

    const canvasRequest = req.body as IntercomCanvasRequest;
    const workspaceId = canvasRequest.workspace_id;
    initializeLogger.debug(`workspace_id: ${workspaceId}`);
    const conversationId = canvasRequest.conversation?.id;
    initializeLogger.debug(`conversation_id: ${conversationId}`);

    // Get services from DI container
    const messageService = container.get<IMessageService>(TYPES.MessageService);
    const canvasService = container.get<CanvasService>(TYPES.CanvasService);

    if (conversationId !== undefined) {
      // Get all messages for the conversation that are not archived, sorted by send_date.
      const messages = await messageService.getMessages(
        workspaceId,
        Number(conversationId)
      );
      if (messages.length > 0) {
        initializeLogger.info(
          'Messages found. Building current snoozes canvas.'
        );
        initializeLogger.profile('currentSnoozesCanvas');
        const currentSnoozesCanvas =
          await canvasService.getCurrentSnoozesCanvas(messages);
        initializeLogger.profile('currentSnoozesCanvas', {
          level: 'info',
          message: 'Completed current snoozes canvas.',
        });
        initializeLogger.debug(
          `Current snoozes canvas: ${JSON.stringify(currentSnoozesCanvas)}`
        );
        res.send(currentSnoozesCanvas);
        return; // Return early if messages are found and response is sent.
      }
    }

    // If no messages are found, build the initial canvas.
    initializeLogger.info('No messages found. Building initial canvas.');
    initializeLogger.profile('initialCanvas');
    const initialCanvas = canvasService.getInitialCanvas();
    initializeLogger.profile('initialCanvas', {
      level: 'info',
      message: 'Completed initial canvas.',
    });
    initializeLogger.debug(`Initial canvas: ${JSON.stringify(initialCanvas)}`);
    res.send(initialCanvas);

    initializeLogger.profile('initialize', {
      level: 'info',
      message: 'Completed initialize request.',
    });
  }
);

export { initialize };
