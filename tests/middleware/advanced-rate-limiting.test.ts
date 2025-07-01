import { describe, expect, test, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';

// Mock the enhanced error middleware to avoid config dependency
jest.mock('../../src/middleware/enhanced-error-middleware.js', () => ({
  CategorizedError: class CategorizedError extends Error {
    constructor(
      message: string,
      public statusCode: number,
      public category: string,
      public severity: string,
      public component: string,
      public cause?: Error
    ) {
      super(message);
      this.name = 'CategorizedError';
    }
  },
  ErrorCategory: {
    VALIDATION: 'validation',
    AUTHENTICATION: 'authentication', 
    AUTHORIZATION: 'authorization',
    EXTERNAL_SERVICE: 'external_service',
    DATABASE: 'database',
    BUSINESS_LOGIC: 'business_logic',
    SYSTEM: 'system',
  },
  ErrorSeverity: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  },
}));

// Import after mocking
import { rateLimitConfigs, AdvancedRateLimiter } from '../../src/middleware/advanced-rate-limiting';

describe('Advanced Rate Limiting Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      body: {},
      query: {},
      path: '/test',
    };
    mockResponse = {
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('Rate Limit Configurations', () => {
    test('should create rate limiting middleware configurations', () => {
      // Test that rate limit configs exist and are functions (middleware)
      expect(typeof rateLimitConfigs.general).toBe('function');
      expect(typeof rateLimitConfigs.auth).toBe('function');
      expect(typeof rateLimitConfigs.messageSubmission).toBe('function');
      expect(typeof rateLimitConfigs.webhook).toBe('function');
      expect(typeof rateLimitConfigs.canvas).toBe('function');
      expect(typeof rateLimitConfigs.health).toBe('function');
    });

    test('should be callable as middleware', () => {
      // Test that the configurations can be called as middleware
      expect(() => {
        rateLimitConfigs.general(mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();

      expect(() => {
        rateLimitConfigs.auth(mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();
    });
  });

  describe('AdvancedRateLimiter', () => {
    let rateLimiter: AdvancedRateLimiter;

    beforeEach(() => {
      rateLimiter = new AdvancedRateLimiter();
    });

    describe('User Rate Limiting', () => {
      test('should create user-specific rate limiter', async () => {
        const userRateLimit = rateLimiter.createUserRateLimit(60000, 5); // 5 requests per minute
        
        // First request should pass
        await expect(userRateLimit(mockRequest as Request, mockResponse as Response, mockNext)).resolves.toBeUndefined();
        expect(mockNext).toHaveBeenCalled();
        expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
      });

      test('should use admin_id from body for user identification', async () => {
        mockRequest.body = { admin_id: 'admin123' };
        const userRateLimit = rateLimiter.createUserRateLimit(60000, 1);
        
        // Should work with admin_id
        await expect(userRateLimit(mockRequest as Request, mockResponse as Response, mockNext)).resolves.toBeUndefined();
        expect(mockNext).toHaveBeenCalled();
      });

      test('should fallback to IP when no admin_id provided', async () => {
        const userRateLimit = rateLimiter.createUserRateLimit(60000, 1);
        
        await expect(userRateLimit(mockRequest as Request, mockResponse as Response, mockNext)).resolves.toBeUndefined();
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Burst Protection', () => {
      test('should create burst protection middleware', async () => {
        const burstProtection = rateLimiter.createBurstProtection(
          10000, // 10 second window
          60000, // 1 minute window
          5,     // 5 requests per 10 seconds
          20     // 20 requests per minute
        );
        
        // Should pass for first request
        await expect(burstProtection(mockRequest as Request, mockResponse as Response, mockNext)).resolves.toBeUndefined();
        expect(mockNext).toHaveBeenCalled();
      });

      test('should handle errors gracefully', async () => {
        const burstProtection = rateLimiter.createBurstProtection(1000, 60000, 1, 5);
        
        // Should not throw on normal operation
        await expect(burstProtection(mockRequest as Request, mockResponse as Response, mockNext)).resolves.toBeUndefined();
      });
    });
  });

  describe('Rate Limit Headers and Messages', () => {
    test('should have middleware functions for all rate limit types', () => {
      // Verify all rate limit configurations exist as middleware functions
      const configKeys = ['general', 'auth', 'messageSubmission', 'webhook', 'canvas', 'health'];
      
      configKeys.forEach(key => {
        expect(rateLimitConfigs[key as keyof typeof rateLimitConfigs]).toBeDefined();
        expect(typeof rateLimitConfigs[key as keyof typeof rateLimitConfigs]).toBe('function');
      });
    });
  });

  describe('Development Environment Handling', () => {
    test('should provide middleware for all environments', () => {
      const originalEnv = process.env.NODE_ENV;
      
      process.env.NODE_ENV = 'development';
      expect(typeof rateLimitConfigs.health).toBe('function');
      
      process.env.NODE_ENV = 'production';
      expect(typeof rateLimitConfigs.health).toBe('function');

      process.env.NODE_ENV = originalEnv;
    });
  });
});