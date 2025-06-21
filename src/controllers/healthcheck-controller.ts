import { RequestHandler } from 'express';
import pool from '../config/db-config.js';
import logger from '../config/logger-config.js';
import { getWorkspace } from '../services/user-db-service.js';

const healthcheckLogger = logger.child({ module: 'healthcheck-controller' });

// GET: / - Perform healthcheck.
const healthcheck: RequestHandler = (_req, res, next) => {
  healthcheckLogger.debug('Checking health of the application.');
  try {
    healthcheckLogger.debug('Application is active.');
    res.status(200).send('Snooze+ is active.');
  } catch (err) {
    healthcheckLogger.error(`An error occurred: ${String(err)}`);
    res.status(500).send(`An error occurred: ${String(err)}`);
    next(err);
  }
};

// GET: /db-healthcheck - Perform healthcheck on the database.
const dbHealthcheck: RequestHandler = (_req, res, next) => {
  healthcheckLogger.debug('Checking database connection.');
  healthcheckLogger.profile('dbHealthcheck');
  interface TimeResult {
    now: Date;
  }
  pool.query('SELECT NOW()', (err, result: { rows: TimeResult[] }) => {
    if (err) {
      healthcheckLogger.error(`Database connection error: ${err}`);
      res.status(500).send(`Unable to connect to the database: ${err}`);
      next(err);
    }
    healthcheckLogger.profile('dbHealthcheck', {
      level: 'debug',
      message: `Database connected: ${result.rows[0]?.now.toISOString() ?? 'Unknown'}`,
    });
    res
      .status(200)
      .send(
        `Database connection is active: ${result.rows[0]?.now.toISOString() ?? 'Unknown'}`
      );
  });
};

// POST: /installation-healthcheck - Handle installation health check requests.
const installationHealthcheck: RequestHandler = async (req, res) => {
  const { workspace_id } = req.body as { workspace_id: string };

  if (!workspace_id) {
    healthcheckLogger.error('workspace_id is missing in the request.');
    res
      .status(400)
      .json({ state: 'UNKNOWN', message: 'Missing workspace_id.' });
    return;
  }

  try {
    const user = await getWorkspace(workspace_id);
    if (user) {
      res.status(200).json({ state: 'OK' });
      return;
    } else {
      res.status(200).json({
        state: 'UNHEALTHY',
        message:
          'Workspace ID not found. The app is not properly installed for this workspace.',
        cta_type: 'REINSTALL_CTA',
        cta_label: 'Reinstall App',
        cta_url: 'https://www.intercom.com/app-store?capability=inbox', // TODO: Replace with link to app listing.
      });
      return;
    }
  } catch (err) {
    healthcheckLogger.error(`Error determining health state: ${String(err)}`);
    res.status(500).json({ state: 'UNKNOWN', message: 'Server error.' });
    return;
  }
};

export { healthcheck, dbHealthcheck, installationHealthcheck };
