import { RequestHandler } from 'express';
import pool from '../config/db-config';
import logger from '../config/logger-config';

const healthcheckLogger = logger.child({ module: 'healthcheck-controller' });

// GET: / - Perform healthcheck.
const healthcheck: RequestHandler = (_req, res, next) => {
  healthcheckLogger.debug('Checking health of the application.');
  try {
    res.status(200).send('Snooze+ is active.');
    healthcheckLogger.debug('Application is active.');
  } catch (err) {
    healthcheckLogger.error(`An error occurred: ${err}`);
    res.status(500).send(`An error occurred: ${err}`);
    next(err);
  }
};

// GET: /db-healthcheck - Perform healthcheck on the database.
const dbHealthcheck: RequestHandler = async (_req, res, next) => {
  healthcheckLogger.debug('Checking database connection.');
  pool.query('SELECT NOW()', (err, result) => {
    if (err) {
      healthcheckLogger.error(`Database connection error: ${err}`);
      res.status(500).send(`Unable to connect to the database: ${err}`);
      next(err);
    }
    healthcheckLogger.debug(`Database connected: ${result.rows[0].now}`);
    res
      .status(200)
      .send(`Database connection is active: ${result.rows[0].now}`);
  });
};

export { healthcheck, dbHealthcheck };
