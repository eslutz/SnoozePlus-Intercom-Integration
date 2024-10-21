import { RequestHandler } from 'express';
import logger from '../config/logger-config';
import * as canvasService from '../services/canvas-service';

// POST: /initialize - Send the initial canvas.
const initialize: RequestHandler = async (req, res, next) => {
  try {
    logger.info('Initialize request received.');
    logger.debug(`Request body: ${JSON.stringify(req.body)}`);
    const initialCanvas = canvasService.getInitialCanvas();
    logger.debug(`Initial canvas: ${JSON.stringify(initialCanvas)}`);
    res.send(initialCanvas);
  } catch (err) {
    logger.error(`An error occurred with the initialize canvas: ${err}`);
    res
      .status(500)
      .send(`An error occurred with the initialize canvas: ${err}`);
    return next(err);
  }
};

export { initialize };
