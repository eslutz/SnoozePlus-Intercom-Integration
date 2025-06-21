import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger-config.js';
import config from '../config/config.js';

const errorLogger = logger.child({
  module: 'error-middleware',
});

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error handler wrapper
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const asyncHandler = (fn: (...args: any[]) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  res.status(404).json({
    error: true,
    message: error.message,
    status: 404,
  });
};

/**
 * Global error handler
 */
export const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response
): void => {
  let error = err as AppError;

  // Log the error
  errorLogger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = new AppError('Validation Error', 400);
  } else if (err.name === 'CastError') {
    error = new AppError('Invalid data format', 400);
  } else if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  } else if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  } else if (err.name === 'MulterError') {
    error = new AppError('File upload error', 400);
  }

  // Determine response format
  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : 'Something went wrong';

  // Prepare error response
  const errorResponse: Record<string, unknown> = {
    error: true,
    message,
    status: statusCode,
  };

  // Include stack trace in development
  if (!config.isProduction) {
    errorResponse.stack = error.stack;
    errorResponse.originalError = err.message;
  }

  // Include request ID for tracking
  errorResponse.requestId = req.headers['x-request-id'] ?? 'unknown';

  res.status(statusCode).json(errorResponse);
};

/**
 * Graceful shutdown handler
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const gracefulShutdown = (server: any) => {
  return (signal: string) => {
    errorLogger.info(`Received ${signal}, starting graceful shutdown`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    server.close((err: Error | null) => {
      if (err) {
        errorLogger.error(`Error closing server: ${String(err)}`);
        process.exit(1);
      }

      void (async () => {
        try {
          errorLogger.info('HTTP server closed');

          // Import these dynamically to avoid circular dependencies
          const { default: pool } = await import('../config/db-config.js');
          const { default: schedule } = await import('node-schedule');
          const { logtail } = await import('../config/logger-config.js');

          errorLogger.info('Draining DB pool.');
          await pool.end();
          errorLogger.info('DB pool drained.');

          errorLogger.info('Canceling scheduled jobs.');
          await schedule.gracefulShutdown();
          errorLogger.info('Scheduled jobs canceled.');

          errorLogger.info('Flushing logs.');
          await logtail.flush();
          errorLogger.info('Logs flushed.');

          errorLogger.info('Application shut down.');
          process.exit(0);
        } catch (cleanupErr) {
          errorLogger.error(`Error during cleanup: ${String(cleanupErr)}`);
          process.exit(1);
        }
      })();
    });

    // Force close after 30 seconds
    setTimeout(() => {
      errorLogger.error('Forcing shutdown after timeout');
      process.exit(1);
    }, 30000);
  };
};

/**
 * Unhandled rejection handler
 */
export const unhandledRejectionHandler = (
  reason: unknown,
  promise: Promise<unknown>
): void => {
  errorLogger.error('Unhandled Promise Rejection', {
    reason,
    promise,
  });

  // Close server gracefully
  process.exit(1);
};

/**
 * Uncaught exception handler
 */
export const uncaughtExceptionHandler = (error: Error): void => {
  errorLogger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
  });

  // Close server gracefully
  process.exit(1);
};
