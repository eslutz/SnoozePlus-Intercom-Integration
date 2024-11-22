import { RequestHandler } from 'express';
import logger from '../config/logger-config';
import * as canvasService from '../services/canvas-service';
import { getMessages } from '../services/message-db-service';

const initializeLogger = logger.child({ module: 'initialize-controller' });

// POST: /initialize - Send the initial canvas.
const initialize: RequestHandler = async (req, res, next) => {
  initializeLogger.info('Initialize request received.');
  initializeLogger.profile('initialize');
  initializeLogger.debug(`Request body: ${JSON.stringify(req.body)}`);
  // const adminId: number = req.body.input.admin.id;
  const adminId: number = Number(req.user?.id);
  const conversationId: number = req.body.input.conversation.id;

  // Get all messages for the conversation that are not archived.
  // Then sort messages by send date, from latest to soonest.
  const messages = (await getMessages(adminId, conversationId)).sort(
    (a, b) => new Date(b.sendDate).getTime() - new Date(a.sendDate).getTime()
  );
  if (messages.length === 0) {
    try {
      initializeLogger.info('No messages found. Building initial canvas.');
      initializeLogger.profile('initialCanvas');
      const initialCanvas = canvasService.getInitialCanvas();
      initializeLogger.profile('initialCanvas', {
        level: 'info',
        message: 'Completed initial canvas.',
      });
      initializeLogger.debug(
        `Initial canvas: ${JSON.stringify(initialCanvas)}`
      );
      res.send(initialCanvas);
    } catch (err) {
      initializeLogger.error(
        `An error occurred with the initialize canvas: ${err}`
      );
      res
        .status(500)
        .send(`An error occurred with the initialize canvas: ${err}`);
      next(err);
    }
    initializeLogger.profile('initialize', {
      level: 'info',
      message: 'Completed initialize request.',
    });
  } else {
    try {
      initializeLogger.info('Messages found. Building current snoozes canvas.');
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
    } catch (err) {
      initializeLogger.error(
        `An error occurred with the current snoozes canvas: ${err}`
      );
      res
        .status(500)
        .send(`An error occurred with the current snoozes canvas: ${err}`);
      next(err);
    }
  }
};

export { initialize };
