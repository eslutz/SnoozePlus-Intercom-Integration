import { RequestHandler } from 'express';
import { pool } from '../config/db-config';
import logger from '../config/logger-config';

// GET: / - Perform healthcheck.
const healthcheck: RequestHandler = async (_req, res, next) => {
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
const dbHealthcheck: RequestHandler = async (_req, res, next) => {
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

export { healthcheck, dbHealthcheck };
