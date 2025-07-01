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

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  (req as RequestWithMetrics).startTime = start;
  
  const route = req.route?.path ?? req.path ?? 'unknown';
  const method = req.method;
  const version = getApiVersion(req);

  // Increment active requests
  Metrics.httpActiveRequests.inc({ method, route });

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const statusCode = res.statusCode.toString();
    
    // Record metrics
    Metrics.httpRequestDuration
      .labels(method, route, statusCode, version)
      .observe(duration);
    
    Metrics.httpRequestTotal
      .labels(method, route, statusCode, version)
      .inc();
    
    // Decrement active requests
    Metrics.httpActiveRequests.dec({ method, route });
  });
  
  next();
};

function getApiVersion(req: Request): string {
  // Extract version from URL path (/api/v1/...) or header
  const pathVersion = (/^\/api\/v(\d+)\//.exec(req.path))?.[1];
  const headerVersion = req.headers['api-version'] as string;
  return pathVersion ?? headerVersion ?? 'v1';
}
