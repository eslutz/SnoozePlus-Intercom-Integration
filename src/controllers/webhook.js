'use strict';

const logger = require('../services/logger');

// HEAD: /webhook - Receive webhook request to validate endpoint.
const validate = async (req, res, next) => {
  try {
    logger.debug(`HEAD request headers: ${JSON.stringify(req.headers)}}`);
    res.status(200).send();
  } catch (err) {
    logger.error(`An error ocurred: ${err}`);
    res.status(500).send();
    return next(err);
  }
};

// POST: /webhook - Receive webhook notifications.
const receiver = async (req, res, next) => {
  try {
    logger.info('Webhook notification received.');
    logger.debug(`Webhook notification body: ${JSON.stringify(req.body)}}`);
    res.status(200).send('Webhook notification received.');
  } catch (err) {
    logger.error(`An error ocurred: ${err}`);
    res.status(500).send(`An error ocurred: ${err}`);
    return next(err);
  }
};

module.exports = {
  validate,
  receiver,
};
