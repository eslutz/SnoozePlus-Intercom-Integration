'use strict';

const canvasService = require('../services/canvas-service');
const logger = require('../config/logger-config');

// POST: /initialize - Send the initial canvas.
const initialize = async (req, res, next) => {
  try {
    logger.info('Initialize request received.');
    logger.debug(`Request body: ${JSON.stringify(req.body)}`);
    const initialCanvas = canvasService.getInitialCanvas();
    logger.debug(`Initial canvas: ${JSON.stringify(initialCanvas)}`);
    res.send(initialCanvas);
  } catch (err) {
    logger.error(`An error ocurred with the initialize canvas: ${err}`);
    res.status(500).send(`An error ocurred with the initialize canvas: ${err}`);
    return next(err);
  }
};

module.exports = { initialize };
