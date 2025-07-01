import 'reflect-metadata';
import { Container } from 'inversify';
import { Logger } from 'winston';
import { TYPES } from '../../src/container/types.js';
import { IntercomService } from '../../src/services/intercom-service-new.js';
import type { ICryptoService, SendMessageParams } from '../../src/container/interfaces.js';

// Mock retry utility to pass through
jest.mock('../../src/utilities/retry-utility.js', () => ({
  retryAsyncOperation: jest.fn((fn: Function) => fn()),
}));

// Mock the config to avoid requiring real config values
jest.mock('../../src/config/config.js', () => ({
  default: {
    intercomUrl: 'https://api.intercom.io',
  },
}));

describe('IntercomService Circuit Breaker Integration', () => {
  let container: Container;
  let intercomService: IntercomService;
  let mockLogger: jest.Mocked<Logger>;
  let mockCryptoService: jest.Mocked<ICryptoService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mocks
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as any;

    mockCryptoService = {
      encrypt: jest.fn(),
      decrypt: jest.fn().mockResolvedValue('decrypted-token'),
      signatureValidator: jest.fn(),
    };

    // Set up container
    container = new Container();
    container.bind<Logger>(TYPES.Logger).toConstantValue(mockLogger);
    container.bind<ICryptoService>(TYPES.CryptoService).toConstantValue(mockCryptoService);
    container.bind<IntercomService>(TYPES.IntercomService).to(IntercomService);

    // Get service instance
    intercomService = container.get<IntercomService>(TYPES.IntercomService);
  });

  describe('Circuit Breaker Behavior', () => {
    test('should have circuit breaker in initial CLOSED state', () => {
      const state = intercomService.getCircuitBreakerState();
      expect(state.state).toBe('CLOSED');
      expect(state.failures).toBe(0);
    });

    test('should provide circuit breaker state information', () => {
      const state = intercomService.getCircuitBreakerState();
      
      expect(state).toHaveProperty('state');
      expect(state).toHaveProperty('failures');
      expect(state).toHaveProperty('lastFailureTime');
      expect(state).toHaveProperty('successCount');
      
      expect(['CLOSED', 'OPEN', 'HALF_OPEN']).toContain(state.state);
      expect(typeof state.failures).toBe('number');
      expect(typeof state.lastFailureTime).toBe('number');
      expect(typeof state.successCount).toBe('number');
    });

    test('should decrypt access token before API operations', async () => {
      const sendParams: SendMessageParams = {
        accessToken: 'encrypted-token',
        conversationId: 123,
        adminId: 456,
        message: 'Test message',
        closeConversation: false,
      };

      // This will fail due to network but we can verify decrypt was called
      try {
        await intercomService.sendMessage(sendParams);
      } catch (error) {
        // Expected to fail since we don't have real API
      }

      // Verify crypto service was called to decrypt token
      expect(mockCryptoService.decrypt).toHaveBeenCalledWith('encrypted-token');
    });

    test('should log appropriate messages during operations', async () => {
      const sendParams: SendMessageParams = {
        accessToken: 'encrypted-token',
        conversationId: 123,
        adminId: 456,
        message: 'Test message',
        closeConversation: false,
      };

      try {
        await intercomService.sendMessage(sendParams);
      } catch (error) {
        // Expected to fail
      }

      // Verify appropriate logging occurred
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Sending message via Intercom',
        {
          conversationId: 123,
          adminId: 456,
        }
      );
    });
  });

  describe('Service Interface Compliance', () => {
    test('should implement all required interface methods', () => {
      expect(typeof intercomService.sendMessage).toBe('function');
      expect(typeof intercomService.addNote).toBe('function');
      expect(typeof intercomService.cancelSnooze).toBe('function');
      expect(typeof intercomService.setSnooze).toBe('function');
      expect(typeof intercomService.closeConversation).toBe('function');
      expect(typeof intercomService.getCircuitBreakerState).toBe('function');
    });

    test('should be properly injectable via DI container', () => {
      // Verify we can get instance from container
      const instance1 = container.get<IntercomService>(TYPES.IntercomService);
      const instance2 = container.get<IntercomService>(TYPES.IntercomService);
      
      // Should be singleton
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(IntercomService);
    });
  });
});