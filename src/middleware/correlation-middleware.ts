/**
 * Middleware for request correlation and tracing.
 *
 * @module middleware/correlation-middleware
 * @exports correlationMiddleware - Request correlation middleware
 * @exports addCorrelationToLogger - Logger correlation enhancement
 */
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

interface RequestWithCorrelation extends Request {
  correlationId?: string;
}

export const correlationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Generate or extract correlation ID
  const correlationId =
    (req.headers['x-correlation-id'] as string) ||
    (req.headers['x-request-id'] as string) ||
    randomUUID();

  (req as RequestWithCorrelation).correlationId = correlationId;

  // Add to response headers
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Request-ID', correlationId);

  next();
};

// Enhanced logger context
export const addCorrelationToLogger = (
  req: RequestWithCorrelation,
  res: Response,
  next: NextFunction
) => {
  const originalJson = res.json;

  // Override response methods to include correlation ID in logs
  res.json = function (body: unknown) {
    if (req.correlationId) {
      // Log response with correlation ID
      console.log(`[${req.correlationId}] Response:`, {
        status: res.statusCode,
        method: req.method,
        path: req.path,
        duration:
          Date.now() - (req as unknown as { startTime?: number }).startTime!,
      });
    }
    return originalJson.call(this, body);
  };

  next();
};
