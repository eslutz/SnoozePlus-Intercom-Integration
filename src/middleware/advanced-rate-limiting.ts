/**
 * Advanced rate limiting middleware with differentiated limits per endpoint type.
 *
 * @module middleware/advanced-rate-limiting
 * @exports rateLimitConfigs - Predefined rate limit configurations
 * @exports AdvancedRateLimiter - Advanced rate limiting with custom logic
 */
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import {
  CategorizedError,
  ErrorCategory,
  ErrorSeverity,
} from './enhanced-error-middleware.js';

// Rate limiting storage interface
interface RateLimitStore {
  incr(key: string): Promise<{ totalHits: number; timeToExpire: number }>;
  decrement(key: string): Promise<void>;
  resetKey(key: string): Promise<void>;
}

// Memory store implementation (for development)
class MemoryStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async incr(
    key: string
  ): Promise<{ totalHits: number; timeToExpire: number }> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry
      const resetTime = now + 15 * 60 * 1000; // 15 minutes
      this.store.set(key, { count: 1, resetTime });
      return { totalHits: 1, timeToExpire: 15 * 60 * 1000 };
    }

    // Increment existing entry
    entry.count++;
    this.store.set(key, entry);
    return {
      totalHits: entry.count,
      timeToExpire: entry.resetTime - now,
    };
  }

  async decrement(key: string): Promise<void> {
    const entry = this.store.get(key);
    if (entry && entry.count > 0) {
      entry.count--;
      this.store.set(key, entry);
    }
  }

  async resetKey(key: string): Promise<void> {
    this.store.delete(key);
  }
}

// Rate limiting configurations
export const rateLimitConfigs = {
  // General API rate limit
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path.includes('/health') || req.path.includes('/metrics');
    },
  }),

  // Authentication endpoints (stricter)
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Message submission (per workspace)
  messageSubmission: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    keyGenerator: (req: Request) => {
      // Rate limit per workspace + IP combination
      const workspaceId =
        ((req.body as Record<string, unknown>)?.workspace_id as string) ??
        'unknown';
      return `${req.ip}:${workspaceId}:submit`;
    },
    message: {
      error:
        'Too many message submissions for this workspace, please slow down.',
      retryAfter: '1 minute',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Webhook endpoints
  webhook: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 50,
    message: {
      error: 'Webhook rate limit exceeded.',
      retryAfter: '1 minute',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Canvas kit interactions
  canvas: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    keyGenerator: (req: Request) => {
      const body = req.body as Record<string, unknown>;
      const query = req.query as Record<string, unknown>;
      const workspaceId =
        (body?.workspace_id as string) ??
        (query?.workspace_id as string) ??
        'unknown';
      return `${req.ip}:${workspaceId}:canvas`;
    },
    message: {
      error: 'Too many canvas interactions.',
      retryAfter: '1 minute',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Health check endpoints (very lenient)
  health: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 200,
    message: {
      error: 'Health check rate limit exceeded.',
      retryAfter: '1 minute',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'development', // Skip in development
  }),
};

// Advanced rate limiting with custom logic
export class AdvancedRateLimiter {
  private store: RateLimitStore;

  constructor(store: RateLimitStore = new MemoryStore()) {
    this.store = store;
  }

  // Per-user rate limiting
  createUserRateLimit(windowMs: number, maxRequests: number) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const body = req.body as Record<string, unknown>;
      const query = req.query as Record<string, unknown>;
      const userId =
        (body?.admin_id as string) ?? (query?.admin_id as string) ?? req.ip;
      const key = `user:${userId}:${Math.floor(Date.now() / windowMs)}`;

      try {
        const { totalHits, timeToExpire } = await this.store.incr(key);

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader(
          'X-RateLimit-Remaining',
          Math.max(0, maxRequests - totalHits).toString()
        );
        res.setHeader(
          'X-RateLimit-Reset',
          new Date(Date.now() + timeToExpire).toISOString()
        );

        if (totalHits > maxRequests) {
          throw new CategorizedError(
            'User rate limit exceeded',
            429,
            ErrorCategory.VALIDATION,
            ErrorSeverity.LOW,
            'rate-limiter'
          );
        }

        next();
      } catch (error) {
        if (error instanceof CategorizedError) {
          throw error;
        }
        next(error);
      }
    };
  }

  // Burst protection (sliding window)
  createBurstProtection(
    shortWindowMs: number,
    longWindowMs: number,
    shortMax: number,
    longMax: number
  ) {
    return async (req: Request, _res: Response, next: NextFunction) => {
      const key = req.ip;
      const now = Date.now();

      const shortWindowKey = `burst:${key}:${Math.floor(now / shortWindowMs)}`;
      const longWindowKey = `burst:${key}:${Math.floor(now / longWindowMs)}`;

      try {
        const [shortWindow, longWindow] = await Promise.all([
          this.store.incr(shortWindowKey),
          this.store.incr(longWindowKey),
        ]);

        if (shortWindow.totalHits > shortMax) {
          throw new CategorizedError(
            'Burst rate limit exceeded',
            429,
            ErrorCategory.VALIDATION,
            ErrorSeverity.MEDIUM,
            'burst-protection'
          );
        }

        if (longWindow.totalHits > longMax) {
          throw new CategorizedError(
            'Long-term rate limit exceeded',
            429,
            ErrorCategory.VALIDATION,
            ErrorSeverity.MEDIUM,
            'burst-protection'
          );
        }

        next();
      } catch (error) {
        if (error instanceof CategorizedError) {
          throw error;
        }
        next(error);
      }
    };
  }
}

// Create default advanced rate limiter instance
export const advancedRateLimiter = new AdvancedRateLimiter();
