import { describe, expect, test } from '@jest/globals';

// Mock the enhanced error middleware
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
  },
  ErrorSeverity: {
    LOW: 'low',
  },
}));

import { enhancedSchemas } from '../../src/middleware/enhanced-validation-middleware';

describe('Intercom Canvas Model Compatibility', () => {
  describe('Canvas Component Validation', () => {
    test('should validate real Intercom canvas initialization payload', () => {
      const realIntercomPayload = {
        canvas_id: 'canvas_123456789',
        workspace_id: 'workspace_abcd1234',
        admin_id: 'admin_5678901',
        conversation_id: 'conv_123456', // Add conversation_id since location is 'conversation'
        current_url: 'https://app.intercom.io/a/apps/abc123/conversations/987654',
        current_state: '',
        context: {
          location: 'conversation',
          conversation_id: 'conv_123456', // Required when location is 'conversation'
        },
        input_values: {},
      };

      const result = enhancedSchemas.canvas.validate(realIntercomPayload);
      expect(result.error).toBeUndefined();
      expect(result.value).toBeDefined();
    });

    test('should validate canvas submission with multiple message inputs', () => {
      const canvasSubmission = {
        canvas_id: 'canvas_snooze_123',
        workspace_id: 'ws_abc123def456',
        admin_id: 'admin_789',
        conversation_id: 'conv_456789',
        current_url: 'https://app.intercom.io/a/apps/test123/conversations/conv_456789',
        input_values: {
          message1: 'Thank you for contacting us. We will get back to you within 24 hours.',
          date1: '2024-01-15T10:30:00Z',
          message2: 'Following up on your request. Do you need any additional assistance?',
          date2: '2024-01-16T10:30:00Z',
          close_conversation: 'false',
        },
      };

      const result = enhancedSchemas.canvasSubmission.validate(canvasSubmission);
      expect(result.error).toBeUndefined();
      expect(result.value?.input_values).toBeDefined();
    });

    test('should sanitize dangerous input while preserving safe content', () => {
      const canvasWithDangerousInput = {
        canvas_id: 'canvas_test',
        workspace_id: 'ws_test',
        admin_id: 'admin_test',
        conversation_id: 'conv_test',
        current_url: 'https://app.intercom.io/test',
        input_values: {
          safe_message: 'Hello <b>customer</b>, we will help you <i>soon</i>!',
          dangerous_message: '<script>alert("xss")</script>Hello customer!',
          mixed_content: 'Safe <strong>bold</strong> text with <script>bad()</script> content',
        },
      };

      const result = enhancedSchemas.canvasSubmission.validate(canvasWithDangerousInput);
      expect(result.error).toBeUndefined();
      
      // Safe content should be preserved
      expect(result.value?.input_values?.safe_message).toContain('<b>customer</b>');
      expect(result.value?.input_values?.safe_message).toContain('<i>soon</i>');
      
      // Dangerous content should be removed
      expect(result.value?.input_values?.dangerous_message).not.toContain('<script>');
      expect(result.value?.input_values?.dangerous_message).toContain('Hello customer!');
      
      // Mixed content should preserve safe parts
      expect(result.value?.input_values?.mixed_content).toContain('<strong>bold</strong>');
      expect(result.value?.input_values?.mixed_content).not.toContain('<script>');
    });
  });

  describe('Webhook Validation', () => {
    test('should validate real Intercom webhook payloads', () => {
      const realWebhookPayload = {
        type: 'conversation.user.created',
        id: '550e8400-e29b-41d4-a716-446655440000',
        created_at: Math.floor(Date.now() / 1000),
        app_id: 'abc12345',
        data: {
          item: {
            type: 'conversation',
            id: '12345678901234567890',
            created_at: Math.floor(Date.now() / 1000),
            updated_at: Math.floor(Date.now() / 1000),
            state: 'open',
            read: false,
            priority: 'not_priority',
            admin_assignee_id: null,
            team_assignee_id: null,
            tags: [],
            waiting_since: Math.floor(Date.now() / 1000),
            snoozed_until: null,
            source: {
              type: 'conversation',
              id: '123456789',
              delivered_as: 'admin_initiated',
              subject: '',
              body: '<p>Test message</p>',
              author: {
                type: 'admin',
                id: '987654321',
                name: 'Admin User',
                email: 'admin@example.com',
              },
              attachments: [],
              url: null,
              redacted: false,
            },
            contacts: [],
            conversation_parts: [],
          },
        },
      };

      const result = enhancedSchemas.webhook.validate(realWebhookPayload);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Message Validation', () => {
    test('should validate scheduled messages with safe HTML', () => {
      const messageWithHtml = {
        message: 'Dear customer,<br><br>Thank you for <strong>your patience</strong>. We have <em>reviewed</em> your case and will respond within 24 hours.<br><br>Best regards,<br>Support Team',
        sendDate: new Date(Date.now() + 60000).toISOString(),
        closeConversation: false,
      };

      const result = enhancedSchemas.message.validate(messageWithHtml);
      expect(result.error).toBeUndefined();
      
      // Safe HTML tags should be preserved
      expect(result.value?.message).toContain('<br>');
      expect(result.value?.message).toContain('<strong>');
      expect(result.value?.message).toContain('<em>');
    });

    test('should handle edge cases for message scheduling', () => {
      const edgeCaseMessages = [
        {
          message: 'Short',
          sendDate: new Date(Date.now() + 1000).toISOString(), // 1 second in future
          closeConversation: true,
        },
        {
          message: 'a'.repeat(9999), // Just under the 10000 character limit
          sendDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 - 1000).toISOString(), // Just under 1 year
          closeConversation: false,
        },
      ];

      edgeCaseMessages.forEach((msg, index) => {
        const result = enhancedSchemas.message.validate(msg);
        expect(result.error).toBeUndefined();
      });
    });
  });

  describe('Security Boundaries', () => {
    test('should reject messages exceeding limits', () => {
      const oversizedMessage = {
        message: 'a'.repeat(10001), // Over the 10000 character limit
        sendDate: new Date(Date.now() + 60000).toISOString(),
      };

      const result = enhancedSchemas.message.validate(oversizedMessage);
      expect(result.error).toBeDefined();
    });

    test('should reject malformed webhook data', () => {
      const malformedWebhook = {
        type: 'invalid.webhook.type',
        id: 'not-a-uuid',
        created_at: Math.floor(Date.now() / 1000) + 1000, // Too far in future
        app_id: 'invalid-app-id-too-long',
        data: {},
      };

      const result = enhancedSchemas.webhook.validate(malformedWebhook);
      expect(result.error).toBeDefined();
    });
  });
});