import 'reflect-metadata';
import { Container } from 'inversify';
import { Pool } from 'pg';
import { Logger } from 'winston';
import { TYPES } from '../../src/container/types.js';
import { MessageService } from '../../src/services/message-service.js';
import type { IMessageService } from '../../src/container/interfaces.js';
import { Message } from '../../src/models/message-model.js';

// Mock the retry utility
jest.mock('../../src/utilities/retry-utility.js', () => ({
  retryAsyncOperation: jest.fn((fn: Function) => fn()),
}));

describe('MessageService (DI)', () => {
  let container: Container;
  let messageService: IMessageService;
  let mockPool: jest.Mocked<Pool>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Create mocks
    mockPool = {
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as any;

    // Set up container
    container = new Container();
    container.bind<Pool>(TYPES.DatabasePool).toConstantValue(mockPool);
    container.bind<Logger>(TYPES.Logger).toConstantValue(mockLogger);
    container.bind<IMessageService>(TYPES.MessageService).to(MessageService);

    // Get service instance
    messageService = container.get<IMessageService>(TYPES.MessageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveMessages', () => {
    test('should save messages and return message IDs', async () => {
      const workspaceId = 'test-workspace';
      const conversationId = 123;
      const messages: Message[] = [
        {
          id: 'msg1',
          workspaceId: 'test-workspace',
          conversationId: 123,
          message: 'Test message 1',
          sendDate: new Date('2024-01-01T10:00:00Z'),
          closeConversation: false,
          archived: false,
        },
        {
          id: 'msg2',
          workspaceId: 'test-workspace',
          conversationId: 123,
          message: 'Test message 2',
          sendDate: new Date('2024-01-02T10:00:00Z'),
          closeConversation: true,
          archived: false,
        },
      ];

      // Mock database responses
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'generated-id-1' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 'generated-id-2' }] } as any);

      const result = await messageService.saveMessages(workspaceId, conversationId, messages);

      expect(result).toEqual(['generated-id-1', 'generated-id-2']);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith('Saving messages', {
        workspaceId,
        conversationId,
        messageCount: 2,
      });
    });

    test('should handle database errors gracefully', async () => {
      const workspaceId = 'test-workspace';
      const conversationId = 123;
      const messages: Message[] = [
        {
          id: 'msg1',
          workspaceId: 'test-workspace',
          conversationId: 123,
          message: 'Test message 1',
          sendDate: new Date('2024-01-01T10:00:00Z'),
          closeConversation: false,
          archived: false,
        },
      ];

      // Mock database error
      mockPool.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        messageService.saveMessages(workspaceId, conversationId, messages)
      ).rejects.toThrow('Database connection failed');

      expect(mockLogger.error).toHaveBeenCalledWith('Error saving messages', {
        workspaceId,
        conversationId,
        error: 'Database connection failed',
      });
    });
  });

  describe('getMessages', () => {
    test('should retrieve messages for workspace and conversation', async () => {
      const workspaceId = 'test-workspace';
      const conversationId = 123;

      const mockRows = [
        {
          id: 'msg1',
          workspace_id: workspaceId,
          conversation_id: conversationId,
          message: 'Test message 1',
          send_date: '2024-01-01T10:00:00Z',
          close_conversation: false,
          archived: false,
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRows } as any);

      const result = await messageService.getMessages(workspaceId, conversationId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('msg1');
      expect(result[0].workspaceId).toBe(workspaceId);
      expect(mockLogger.debug).toHaveBeenCalledWith('Getting messages', {
        workspaceId,
        conversationId,
      });
    });
  });

  describe('archiveMessages', () => {
    test('should archive messages and return count', async () => {
      const workspaceId = 'test-workspace';
      const conversationId = 123;

      mockPool.query.mockResolvedValue({ rowCount: 3 } as any);

      const result = await messageService.archiveMessages(workspaceId, conversationId);

      expect(result).toBe(3);
      expect(mockLogger.info).toHaveBeenCalledWith('Archiving messages', {
        workspaceId,
        conversationId,
      });
      expect(mockLogger.debug).toHaveBeenCalledWith('Messages archived', {
        workspaceId,
        conversationId,
        rowsAffected: 3,
      });
    });
  });

  describe('archiveMessage', () => {
    test('should archive a single message', async () => {
      const messageId = 'test-message-id';

      mockPool.query.mockResolvedValue({ rowCount: 1 } as any);

      const result = await messageService.archiveMessage(messageId);

      expect(result).toBe(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Archiving message', { messageId });
    });
  });

  describe('getTodaysMessages', () => {
    test('should retrieve messages scheduled for today', async () => {
      const mockRows = [
        {
          id: 'msg1',
          workspace_id: 'workspace1',
          conversation_id: 123,
          message: 'Test message 1',
          send_date: '2024-01-01T10:00:00Z',
          close_conversation: false,
          archived: false,
          admin_id: 456,
          access_token: 'encrypted-token',
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockRows } as any);

      const result = await messageService.getTodaysMessages();

      expect(result).toHaveLength(1);
      expect(result[0].adminId).toBe(456);
      expect(result[0].accessToken).toBe('encrypted-token');
      expect(mockLogger.debug).toHaveBeenCalledWith('Getting today\'s messages');
    });
  });

  describe('getRemainingMessageCount', () => {
    test('should return count of remaining messages', async () => {
      const message: Message = {
        id: 'msg1',
        workspaceId: 'test-workspace',
        conversationId: 123,
        message: 'Test message',
        sendDate: new Date(),
        closeConversation: false,
        archived: false,
      };

      mockPool.query.mockResolvedValue({ rows: [{ count: '5' }] } as any);

      const result = await messageService.getRemainingMessageCount(message);

      expect(result).toBe(5);
      expect(mockLogger.debug).toHaveBeenCalledWith('Getting remaining message count', {
        workspaceId: message.workspaceId,
        conversationId: message.conversationId,
      });
    });
  });
});