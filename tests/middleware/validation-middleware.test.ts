import { describe, expect, test } from '@jest/globals';
import Joi from 'joi';

// Simple validation schemas for testing
const testSchemas = {
  webhook: Joi.object({
    type: Joi.string().required(),
    data: Joi.object().required(),
    created_at: Joi.number().integer().positive(),
    id: Joi.string(),
  }),

  message: Joi.object({
    message: Joi.string().max(5000).required(),
    sendDate: Joi.date().iso().min('now').required(),
  }),

  snoozeRequest: Joi.object({
    conversationId: Joi.string().required(),
    adminId: Joi.string().required(),
    workspaceId: Joi.string().required(),
    messages: Joi.array().items(
      Joi.object({
        message: Joi.string().max(5000).required(),
        sendDate: Joi.date().iso().min('now').required(),
      })
    ).min(1).max(10).required(),
  }),
};

describe('Validation Schemas', () => {
  describe('webhook schema', () => {
    test('should validate valid webhook payload', () => {
      const validPayload = {
        type: 'conversation.created',
        data: { conversation: { id: '123' } },
        created_at: 1640995200,
        id: 'webhook-123'
      };

      const { error, value } = testSchemas.webhook.validate(validPayload);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validPayload);
    });

    test('should reject webhook without required fields', () => {
      const invalidPayload = {
        data: { conversation: { id: '123' } }
      };

      const { error } = testSchemas.webhook.validate(invalidPayload);
      
      expect(error).toBeDefined();
      expect(error!.details[0]!.path).toContain('type');
    });
  });

  describe('message schema', () => {
    test('should validate valid message', () => {
      const validMessage = {
        message: 'Hello, this is a test message',
        sendDate: new Date(Date.now() + 60000).toISOString() // 1 minute in future
      };

      const { error, value } = testSchemas.message.validate(validMessage);
      
      expect(error).toBeUndefined();
      expect(value.message).toBe(validMessage.message);
    });

    test('should reject message that is too long', () => {
      const longMessage = {
        message: 'a'.repeat(5001), // Over 5000 character limit
        sendDate: new Date(Date.now() + 60000).toISOString()
      };

      const { error } = testSchemas.message.validate(longMessage);
      
      expect(error).toBeDefined();
      expect(error!.details[0]!.message).toContain('length');
    });

    test('should reject message with past date', () => {
      const pastMessage = {
        message: 'Test message',
        sendDate: new Date(Date.now() - 60000).toISOString() // 1 minute in past
      };

      const { error } = testSchemas.message.validate(pastMessage);
      
      expect(error).toBeDefined();
      expect(error!.details[0]!.message).toContain('greater');
    });
  });

  describe('snoozeRequest schema', () => {
    test('should validate valid snooze request', () => {
      const validRequest = {
        conversationId: 'conv-123',
        adminId: 'admin-456',
        workspaceId: 'workspace-789',
        messages: [
          {
            message: 'First message',
            sendDate: new Date(Date.now() + 60000).toISOString()
          },
          {
            message: 'Second message',
            sendDate: new Date(Date.now() + 120000).toISOString()
          }
        ]
      };

      const { error } = testSchemas.snoozeRequest.validate(validRequest);
      
      expect(error).toBeUndefined();
    });

    test('should reject request with too many messages', () => {
      const invalidRequest = {
        conversationId: 'conv-123',
        adminId: 'admin-456',
        workspaceId: 'workspace-789',
        messages: Array(11).fill({
          message: 'Test message',
          sendDate: new Date(Date.now() + 60000).toISOString()
        })
      };

      const { error } = testSchemas.snoozeRequest.validate(invalidRequest);
      
      expect(error).toBeDefined();
      expect(error!.details[0]!.message).toContain('less than or equal to 10');
    });

    test('should reject request with no messages', () => {
      const invalidRequest = {
        conversationId: 'conv-123',
        adminId: 'admin-456',
        workspaceId: 'workspace-789',
        messages: []
      };

      const { error } = testSchemas.snoozeRequest.validate(invalidRequest);
      
      expect(error).toBeDefined();
      expect(error!.details[0]!.message).toContain('at least 1');
    });
  });
});