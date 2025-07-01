/**
 * Enhanced error handling middleware with categorization and metrics.
 *
 * @module middleware/enhanced-error-middleware
 * @exports CategorizedError - Enhanced error class with categorization
 * @exports ErrorCategory - Error category enumeration
 * @exports ErrorSeverity - Error severity enumeration
 * @exports enhancedErrorHandler - Enhanced error handler middleware
 */
import { Request, Response, NextFunction } from 'express';
import { Metrics } from '../monitoring/metrics.js';
import logger from '../config/logger-config.js';

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export class CategorizedError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public category: ErrorCategory = ErrorCategory.SYSTEM,
    public severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    public component = 'unknown',
    public originalError?: Error
  ) {
    super(message);
    this.name = 'CategorizedError';
  }
}

export const enhancedErrorHandler = (
  err: Error | CategorizedError,
  req: Request & { correlationId?: string },
  res: Response,
  _next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars -- Required by Express error handler interface
) => {
  const correlationId = req.correlationId ?? 'unknown';

  let statusCode = 500;
  let category = ErrorCategory.SYSTEM;
  let severity = ErrorSeverity.MEDIUM;
  let component = 'unknown';
  let userMessage = 'An internal server error occurred';

  if (err instanceof CategorizedError) {
    statusCode = err.statusCode;
    category = err.category;
    severity = err.severity;
    component = err.component;

    // Determine user-safe message based on category
    switch (category) {
      case ErrorCategory.VALIDATION:
        userMessage = err.message;
        break;
      case ErrorCategory.AUTHENTICATION:
        userMessage = 'Authentication failed';
        break;
      case ErrorCategory.AUTHORIZATION:
        userMessage = 'Access denied';
        break;
      case ErrorCategory.EXTERNAL_SERVICE:
        userMessage = 'External service temporarily unavailable';
        break;
      default:
        userMessage = 'An internal server error occurred';
    }
  }

  // Record error metrics
  Metrics.errorRate.inc({
    type: category,
    severity,
    component,
  });

  // Log error with full context
  logger.error('Request error', {
    correlationId,
    error: {
      message: err.message,
      stack: err.stack,
      category,
      severity,
      component,
      statusCode,
    },
    request: {
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    },
  });

  // Send appropriate response based on environment
  const isProduction = process.env.NODE_ENV === 'production';

  const errorResponse = {
    error: {
      message: userMessage,
      correlationId,
      timestamp: new Date().toISOString(),
      ...(isProduction
        ? {}
        : {
            details: err.message,
            stack: err.stack,
            category,
            severity,
          }),
    },
  };

  res.status(statusCode).json(errorResponse);
};
