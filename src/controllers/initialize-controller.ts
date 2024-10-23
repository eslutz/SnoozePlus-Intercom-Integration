import { RequestHandler } from 'express';
import logger from '../config/logger-config';
import * as canvasService from '../services/canvas-service';

const initializeLogger = logger.child({ module: 'initialize-controller' });

// POST: /initialize - Send the initial canvas.
const initialize: RequestHandler = async (req, res, next) => {
  initializeLogger.info('Initialize request received.');
  initializeLogger.profile('initialize');
  initializeLogger.debug(`Request body: ${JSON.stringify(req.body)}`);

  try {
    initializeLogger.info('Building initial canvas.');
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
};

export { initialize };
