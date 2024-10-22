import { RequestHandler } from 'express';
import logger from '../config/logger-config';
import * as canvasService from '../services/canvas-service';

const initializeLogger = logger.child({ module: 'initialize-controller' });

// POST: /initialize - Send the initial canvas.
const initialize: RequestHandler = async (req, res, next) => {
  try {
    initializeLogger.info('Initialize request received.');
    initializeLogger.debug(`Request body: ${JSON.stringify(req.body)}`);
    const initialCanvas = canvasService.getInitialCanvas();
    initializeLogger.debug(`Initial canvas: ${JSON.stringify(initialCanvas)}`);
    res.send(initialCanvas);
  } catch (err) {
    initializeLogger.error(
      `An error occurred with the initialize canvas: ${err}`
    );
    res
      .status(500)
      .send(`An error occurred with the initialize canvas: ${err}`);
    return next(err);
  }
};

export { initialize };
