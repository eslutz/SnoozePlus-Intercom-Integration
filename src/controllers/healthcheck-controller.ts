import { RequestHandler } from 'express';
import pool from '../config/db-config.js';
import logger from '../config/logger-config.js';
import { getWorkspace } from '../services/user-db-service.js';
import { asyncHandler, AppError } from '../middleware/error-middleware.js';

const healthcheckLogger = logger.child({ module: 'healthcheck-controller' });

// GET: / - Perform healthcheck.
const healthcheck: RequestHandler = asyncHandler(async (_req, res) => {
  healthcheckLogger.debug('Checking health of the application.');
  healthcheckLogger.debug('Application is active.');
  res.status(200).send('Snooze+ is active.');
});

// GET: /db-healthcheck - Perform healthcheck on the database.
const dbHealthcheck: RequestHandler = asyncHandler(async (_req, res) => {
  healthcheckLogger.debug('Checking database connection.');
  healthcheckLogger.profile('dbHealthcheck');

  interface TimeResult {
    now: Date;
  }

  const result = await new Promise<{ rows: TimeResult[] }>(
    (resolve, reject) => {
      pool.query('SELECT NOW()', (err, result: { rows: TimeResult[] }) => {
        if (err) {
          reject(
            new AppError(`Database connection error: ${err.message}`, 503)
          );
        } else {
          resolve(result);
        }
      });
    }
  );

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

// POST: /installation-healthcheck - Handle installation health check requests.
const installationHealthcheck: RequestHandler = asyncHandler(
  async (req, res) => {
    const { workspace_id } = req.body as { workspace_id: string };

    if (!workspace_id) {
      throw new AppError('Missing workspace_id.', 400);
    }

    const user = await getWorkspace(workspace_id);
    if (user) {
      res.status(200).json({ state: 'OK' });
    } else {
      res.status(200).json({
        state: 'UNHEALTHY',
        message:
          'Workspace ID not found. The app is not properly installed for this workspace.',
        cta_type: 'REINSTALL_CTA',
        cta_label: 'Reinstall App',
        cta_url: 'https://www.intercom.com/app-store?capability=inbox', // TODO: Replace with link to app listing.
      });
    }
  }
);

export { healthcheck, dbHealthcheck, installationHealthcheck };
