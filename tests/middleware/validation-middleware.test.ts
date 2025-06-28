import { describe, expect, test } from '@jest/globals';
import { schemas } from '../../src/middleware/validation-middleware';

describe('Validation Schemas', () => {
  describe('webhook schema', () => {
    test('should validate valid webhook payload', () => {
      const validPayload = {
        type: 'conversation.created',
        data: { conversation: { id: '123' } },
        created_at: 1640995200,
        id: 'webhook-123',
      };

      const result = schemas.webhook.validate(validPayload);

      expect(result.error).toBeUndefined();
      expect(result.value).toEqual(validPayload);
    });

    test('should reject webhook without required fields', () => {
      const invalidPayload = {
        data: { conversation: { id: '123' } },
      };

      const result = schemas.webhook.validate(invalidPayload);

      expect(result.error).toBeDefined();
      expect(result.error!.details[0]!.path).toContain('type');
    });
  });

  describe('message schema', () => {
    test('should validate valid message', () => {
      const validMessage = {
        message: 'Hello, this is a test message',
        sendDate: new Date(Date.now() + 60000).toISOString(), // 1 minute in future
      };

      const result = schemas.message.validate(validMessage);

      expect(result.error).toBeUndefined();
      expect((result.value as { message: string }).message).toBe(
        validMessage.message
      );
    });

    test('should reject message that is too long', () => {
      const longMessage = {
        message: 'a'.repeat(5001), // Over 5000 character limit
        sendDate: new Date(Date.now() + 60000).toISOString(),
      };

      const result = schemas.message.validate(longMessage);

      expect(result.error).toBeDefined();
      expect(result.error!.details[0]!.message).toContain('length');
    });

    test('should reject message with past date', () => {
      const pastMessage = {
        message: 'Test message',
        sendDate: new Date(Date.now() - 60000).toISOString(), // 1 minute in past
      };

      const result = schemas.message.validate(pastMessage);

      expect(result.error).toBeDefined();
      expect(result.error!.details[0]!.message).toContain('greater');
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
            sendDate: new Date(Date.now() + 60000).toISOString(),
          },
          {
            message: 'Second message',
            sendDate: new Date(Date.now() + 120000).toISOString(),
          },
        ],
      };

      const result = schemas.snoozeRequest.validate(validRequest);

      expect(result.error).toBeUndefined();
    });

    test('should reject request with too many messages', () => {
      const invalidRequest = {
        conversationId: 'conv-123',
        adminId: 'admin-456',
        workspaceId: 'workspace-789',
        messages: Array(11).fill({
          message: 'Test message',
          sendDate: new Date(Date.now() + 60000).toISOString(),
        }),
      };

      const result = schemas.snoozeRequest.validate(invalidRequest);

      expect(result.error).toBeDefined();
      expect(result.error!.details[0]!.message).toContain(
        'less than or equal to 10'
      );
    });

    test('should reject request with no messages', () => {
      const invalidRequest = {
        conversationId: 'conv-123',
        adminId: 'admin-456',
        workspaceId: 'workspace-789',
        messages: [],
      };

      const result = schemas.snoozeRequest.validate(invalidRequest);

      expect(result.error).toBeDefined();
      expect(result.error!.details[0]!.message).toContain('at least 1');
    });
  });
});
