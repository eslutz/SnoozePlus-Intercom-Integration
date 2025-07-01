/**
 * Request size limiting middleware for different endpoint types.
 *
 * @module middleware/request-size-limiting
 * @exports createRequestSizeLimiter - Factory for creating size limiters
 * @exports requestSizeLimits - Predefined size limits for different endpoints
 */
import { Request, Response, NextFunction } from 'express';
import {
  CategorizedError,
  ErrorCategory,
  ErrorSeverity,
} from './enhanced-error-middleware.js';

export const createRequestSizeLimiter = (maxSize: number) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] ?? '0', 10);

    if (contentLength > maxSize) {
      throw new CategorizedError(
        `Request body too large. Maximum size is ${maxSize} bytes`,
        413,
        ErrorCategory.VALIDATION,
        ErrorSeverity.LOW,
        'request-size-limiter'
      );
    }

    let receivedBytes = 0;

    req.on('data', (chunk: Buffer) => {
      receivedBytes += chunk.length;
      if (receivedBytes > maxSize) {
        req.destroy();
        throw new CategorizedError(
          'Request body too large',
          413,
          ErrorCategory.VALIDATION,
          ErrorSeverity.LOW,
          'request-size-limiter'
        );
      }
    });

    next();
  };
};

// Different size limits for different endpoints
export const requestSizeLimits = {
  // General API requests
  general: createRequestSizeLimiter(1024 * 1024), // 1MB

  // Message submissions (allow larger for multiple messages)
  messages: createRequestSizeLimiter(5 * 1024 * 1024), // 5MB

  // Webhook payloads (Intercom webhooks are typically small)
  webhooks: createRequestSizeLimiter(512 * 1024), // 512KB

  // File uploads (if needed in future)
  uploads: createRequestSizeLimiter(10 * 1024 * 1024), // 10MB

  // Canvas submissions (moderate size for UI data)
  canvas: createRequestSizeLimiter(2 * 1024 * 1024), // 2MB

  // Health checks (very small)
  health: createRequestSizeLimiter(64 * 1024), // 64KB
};
