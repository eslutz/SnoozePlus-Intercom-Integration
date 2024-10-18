'use strict';

const { pool } = require('./config/db-config');
const logger = require('../config/logger-config');

// GET: / - Perform healthcheck.
const healthcheck = async (req, res, next) => {
  logger.debug('Checking health of the application.');
  try {
    res.status(200).send('Snooze+ is active.');
  } catch (err) {
    logger.error(`An error ocurred: ${err}`);
    res.status(500).send(`An error ocurred: ${err}`);
    return next(err);
  }
};

// GET: /db-healthcheck - Perform healthcheck on the database.
const dbHealthcheck = async (req, res, next) => {
  logger.debug('Checking database connection.');
  try {
    pool.query('SELECT NOW()', (err, result) => {
      if (err) {
        logger.error(`Database connection error: ${err}`);
        res.status(500).send(`Unable to connect to the database: ${err}`);
      } else {
        logger.debug(`Database connected: ${result.rows[0].now}`);
        res
          .status(200)
          .send(`Database connection is active: ${result.rows[0].now}`);
      }
    });
  } catch (err) {
    logger.error(`An error ocurred: ${err}`);
    res.status(500).send(`An error ocurred: ${err}`);
    return next(err);
  }
};

module.exports = { healthcheck, dbHealthcheck };
