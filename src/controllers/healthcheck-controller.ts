import { RequestHandler, Request, Response } from 'express';
import { getPoolMetrics, checkDatabaseHealth } from '../config/db-config.js';
import logger from '../config/logger-config.js';
import { getWorkspace } from '../services/user-db-service.js';
import { asyncHandler, AppError } from '../middleware/error-middleware.js';
import { messageScheduler } from '../utilities/scheduler-utility.js';

const healthcheckLogger = logger.child({ module: 'healthcheck-controller' });

// GET: / - Perform healthcheck.
const healthcheck: RequestHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    await Promise.resolve(); // Satisfy linter for async function
    healthcheckLogger.debug('Checking health of the application.');
    healthcheckLogger.debug('Application is active.');
    res.status(200).send('Snooze+ is active.');
  }
);

// GET: /db-healthcheck - Perform healthcheck on the database.
const dbHealthcheck: RequestHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    healthcheckLogger.debug('Checking database connection.');
    healthcheckLogger.profile('dbHealthcheck');

    const isHealthy = await checkDatabaseHealth();
    const poolStats = getPoolMetrics();
    const schedulerStats = {
      activeJobs: messageScheduler.getActiveJobCount(),
    };

    if (isHealthy) {
      healthcheckLogger.profile('dbHealthcheck', {
        level: 'debug',
        message: 'Database health check passed',
      });

      res.status(200).json({
        status: 'healthy',
        database: {
          connected: true,
          pool: poolStats,
        },
        scheduler: schedulerStats,
        timestamp: new Date().toISOString(),
      });
    } else {
      throw new AppError('Database health check failed', 503);
    }
  }
);

// POST: /installation-healthcheck - Handle installation health check requests.
const installationHealthcheck: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
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
