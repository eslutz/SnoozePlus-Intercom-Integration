import { describe, expect, test } from '@jest/globals';
import Joi from 'joi';
// Import individual functions and schemas without importing the error middleware that requires config
import DOMPurify from 'isomorphic-dompurify';

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
import { enhancedSchemas, validateSchema } from '../../src/middleware/enhanced-validation-middleware';
import { Request, Response, NextFunction } from 'express';

describe('Enhanced Validation Middleware', () => {
  // Mock request, response, and next function
  const mockNext: NextFunction = jest.fn();
  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Enhanced Canvas Schema', () => {
    test('should validate valid canvas payload with XSS protection', () => {
      const validPayload = {
        canvas_id: 'canvas-123',
        workspace_id: 'workspace-456',
        admin_id: 'admin-789',
        conversation_id: 'conv-123',
        current_url: 'https://app.intercom.io',
        input_values: {
          message1: 'Hello world',
          message2: 'Safe content with <b>bold</b> text',
        },
      };

      const result = enhancedSchemas.canvas.validate(validPayload);
      expect(result.error).toBeUndefined();
    });

    test('should sanitize XSS attempts in canvas input values', () => {
      const maliciousPayload = {
        canvas_id: 'canvas-123',
        workspace_id: 'workspace-456',
        admin_id: 'admin-789',
        conversation_id: 'conv-123',
        current_url: 'https://app.intercom.io',
        input_values: {
          message1: '<script>alert("xss")</script>Hello world',
          message2: 'javascript:alert("xss")',
        },
      };

      const result = enhancedSchemas.canvas.validate(maliciousPayload);
      
      // Should sanitize the malicious content
      expect(result.value?.input_values?.message1).not.toContain('<script>');
      expect(result.value?.input_values?.message1).toContain('Hello world');
    });

    test('should reject canvas payload with invalid URL', () => {
      const invalidPayload = {
        canvas_id: 'canvas-123',
        workspace_id: 'workspace-456', 
        admin_id: 'admin-789',
        conversation_id: 'conv-123',
        current_url: 'not-a-valid-url',
        input_values: {
          message1: 'Hello world',
        },
      };

      const result = enhancedSchemas.canvas.validate(invalidPayload);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0]?.message).toContain('valid uri');
    });
  });

  describe('Enhanced Message Schema', () => {
    test('should validate valid message with future date', () => {
      const validMessage = {
        message: 'Hello, this is a test message',
        sendDate: new Date(Date.now() + 60000).toISOString(),
        closeConversation: false,
      };

      const result = enhancedSchemas.message.validate(validMessage);
      expect(result.error).toBeUndefined();
    });

    test('should sanitize HTML in message content', () => {
      const messageWithHtml = {
        message: '<p>Safe paragraph</p><script>alert("xss")</script>',
        sendDate: new Date(Date.now() + 60000).toISOString(),
      };

      const result = enhancedSchemas.message.validate(messageWithHtml);
      
      // Should allow safe HTML but remove dangerous content
      expect(result.value?.message).toContain('<p>Safe paragraph</p>');
      expect(result.value?.message).not.toContain('<script>');
    });

    test('should reject messages that are too long', () => {
      const longMessage = {
        message: 'a'.repeat(10001), // Over 10000 character limit
        sendDate: new Date(Date.now() + 60000).toISOString(),
      };

      const result = enhancedSchemas.message.validate(longMessage);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0]?.message).toContain('10000');
    });

    test('should reject messages with past dates', () => {
      const pastMessage = {
        message: 'Test message',
        sendDate: new Date(Date.now() - 60000).toISOString(),
      };

      const result = enhancedSchemas.message.validate(pastMessage);
      expect(result.error).toBeDefined();
    });
  });

  describe('Enhanced Webhook Schema', () => {
    test('should validate valid webhook payload', () => {
      const validWebhook = {
        type: 'conversation.user.created',
        data: { conversation: { id: '123' } },
        created_at: Math.floor(Date.now() / 1000),
        id: '550e8400-e29b-41d4-a716-446655440000',
        app_id: 'abc12345',
      };

      const result = enhancedSchemas.webhook.validate(validWebhook);
      expect(result.error).toBeUndefined();
    });

    test('should reject webhook with future timestamp beyond threshold', () => {
      const futureWebhook = {
        type: 'conversation.user.created',
        data: { conversation: { id: '123' } },
        created_at: Math.floor(Date.now() / 1000) + 600, // 10 minutes in future
        id: '550e8400-e29b-41d4-a716-446655440000',
        app_id: 'abc12345',
      };

      const result = enhancedSchemas.webhook.validate(futureWebhook);
      expect(result.error).toBeDefined();
    });

    test('should reject webhook with invalid type', () => {
      const invalidWebhook = {
        type: 'invalid.webhook.type',
        data: { conversation: { id: '123' } },
        created_at: Math.floor(Date.now() / 1000),
        id: '550e8400-e29b-41d4-a716-446655440000',
        app_id: 'abc12345',
      };

      const result = enhancedSchemas.webhook.validate(invalidWebhook);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateSchema middleware', () => {
    test('should pass validation for valid data', () => {
      const validData = { message: 'test', sendDate: new Date(Date.now() + 60000).toISOString() };
      const mockRequest = { body: validData } as Request;
      
      const middleware = validateSchema(enhancedSchemas.message, 'body');
      
      expect(() => middleware(mockRequest, mockResponse, mockNext)).not.toThrow();
      expect(mockNext).toHaveBeenCalled();
    });

    test('should throw CategorizedError for invalid data', () => {
      const invalidData = { message: '', sendDate: 'invalid-date' };
      const mockRequest = { body: invalidData } as Request;
      
      const middleware = validateSchema(enhancedSchemas.message, 'body');
      
      expect(() => middleware(mockRequest, mockResponse, mockNext)).toThrow();
    });

    test('should sanitize data and update request object', () => {
      const dataWithXss = { 
        message: '<script>alert("xss")</script>Hello', 
        sendDate: new Date(Date.now() + 60000).toISOString() 
      };
      const mockRequest = { body: dataWithXss } as Request;
      
      const middleware = validateSchema(enhancedSchemas.message, 'body');
      middleware(mockRequest, mockResponse, mockNext);
      
      // Data should be sanitized
      expect((mockRequest.body as any).message).not.toContain('<script>');
      expect((mockRequest.body as any).message).toContain('Hello');
    });
  });
});