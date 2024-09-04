const logger = require('../services/logger');

// GET: / - Perform healthcheck.
const healthcheck = async (req, res, next) => {
  try {
    logger.debug(`GET request body: ${JSON.stringify(req.body)}}`);
    res.status(200).send('Snooze+ is active.');
  } catch (err) {
    logger.error(`An error ocurred: ${err}`);
    res.status(500).send(`An error ocurred: ${err}`);
    return next(err);
  }
};

module.exports = { healthcheck };
