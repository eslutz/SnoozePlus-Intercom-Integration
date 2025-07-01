/**
 * Controller for monitoring endpoints including metrics and health checks.
 *
 * @module controllers/monitoring-controller
 * @exports metricsEndpoint - Prometheus metrics endpoint
 * @exports enhancedHealthCheck - Comprehensive health check
 * @exports readinessCheck - Kubernetes readiness check
 */
import { RequestHandler, Request, Response } from 'express';
import { register } from 'prom-client';
import { Metrics } from '../monitoring/metrics.js';
import { checkDatabaseHealth, getPoolMetrics } from '../config/db-config.js';
import { messageScheduler } from '../utilities/scheduler-utility.js';
import { asyncHandler } from '../middleware/error-middleware.js';

// Metrics endpoint
export const metricsEndpoint: RequestHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    // Update database pool metrics before serving
    const poolMetrics = getPoolMetrics();
    Metrics.updateDbPoolMetrics(poolMetrics);

    // Update scheduler metrics
    Metrics.activeScheduledJobs.set(messageScheduler.getActiveJobCount());

    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  }
);

// Comprehensive health check
export const enhancedHealthCheck: RequestHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    const checks = {
      database: await checkDatabaseHealth(),
      scheduler: messageScheduler.getActiveJobCount() >= 0,
      memory: process.memoryUsage().heapUsed < 1024 * 1024 * 1024, // < 1GB
      uptime: process.uptime() > 0,
    };

    const isHealthy = Object.values(checks).every((check) => check === true);
    const status = isHealthy ? 'healthy' : 'unhealthy';

    res.status(isHealthy ? 200 : 503).json({
      status,
      timestamp: new Date().toISOString(),
      checks,
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? 'unknown',
    });
  }
);

// Readiness check (for Kubernetes)
export const readinessCheck: RequestHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    const isReady = await checkDatabaseHealth();

    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
    });
  }
);
