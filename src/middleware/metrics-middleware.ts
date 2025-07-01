/**
 * Middleware for collecting HTTP request metrics.
 *
 * @module middleware/metrics-middleware
 * @exports metricsMiddleware - Main metrics collection middleware
 */
import { Request, Response, NextFunction } from 'express';
import { Metrics } from '../monitoring/metrics.js';

interface RequestWithMetrics extends Request {
  startTime?: number;
  correlationId?: string;
}

export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  (req as RequestWithMetrics).startTime = start;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- Express route.path type may be any
  const route = req.route?.path ?? req.path ?? 'unknown';
  const method = req.method;
  const version = getApiVersion(req);

  // Increment active requests
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- route variable may be any from Express
  Metrics.httpActiveRequests.inc({ method, route });

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const statusCode = res.statusCode.toString();

    // Record metrics
    Metrics.httpRequestDuration
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- route variable may be any from Express
      .labels(method, route, statusCode, version)
      .observe(duration);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- route variable may be any from Express
    Metrics.httpRequestTotal.labels(method, route, statusCode, version).inc();

    // Decrement active requests
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- route variable may be any from Express
    Metrics.httpActiveRequests.dec({ method, route });
  });

  next();
};

function getApiVersion(req: Request): string {
  // Extract version from URL path (/api/v1/...) or header
  const pathVersion = /^\/api\/v(\d+)\//.exec(req.path)?.[1];
  const headerVersion = req.headers['api-version'] as string;

  const version = pathVersion ?? headerVersion ?? '1';
  return version.startsWith('v') ? version : `v${version}`;
}
