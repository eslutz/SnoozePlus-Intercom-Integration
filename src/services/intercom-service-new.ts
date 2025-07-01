import { injectable, inject } from 'inversify';
import fetch from 'node-fetch';
import { Logger } from 'winston';
import { TYPES } from '../container/types.js';
import type { 
  IIntercomService, 
  ICryptoService,
  SendMessageParams, 
  AddNoteParams,
  CancelSnoozeParams,
  SetSnoozeParams,
  CloseConversationParams
} from '../container/interfaces.js';
import { CircuitBreaker } from '../utilities/circuit-breaker.js';
import { retryAsyncOperation } from '../utilities/retry-utility.js';
import { Message } from '../models/message-model.js';
import config from '../config/config.js';

/**
 * Injectable Intercom service with circuit breaker protection
 */
@injectable()
export class IntercomService implements IIntercomService {
  private circuitBreaker: CircuitBreaker;
  private readonly baseUrl = config.intercomUrl;

  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.CryptoService) private cryptoService: ICryptoService
  ) {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      timeout: 10000, // 10 seconds
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 30000, // 30 seconds
    });
  }

  /**
   * Sends a message to an Intercom conversation with circuit breaker protection
   */
  async sendMessage(params: SendMessageParams): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      return retryAsyncOperation(async () => {
        this.logger.info('Sending message via Intercom', {
          conversationId: params.conversationId,
          adminId: params.adminId,
        });

        // Decrypt the access token
        const decryptedAccessToken = await this.cryptoService.decrypt(params.accessToken);
        
        // For Message objects, we need to decrypt the message content as well
        let messageBody = params.message;
        if (typeof params.message === 'object' && 'message' in params.message) {
          const message = params.message as Message;
          messageBody = await this.cryptoService.decrypt(message.message);
        }

        const response = await fetch(`${this.baseUrl}/conversations/${params.conversationId}/reply`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${decryptedAccessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Intercom-Version': '2.11',
          },
          body: JSON.stringify({
            message_type: 'comment',
            type: 'admin',
            admin_id: params.adminId.toString(),
            body: `<p>${messageBody}</p>`,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Intercom API error: ${response.status} - ${errorBody}`);
        }

        if (params.closeConversation) {
          await this.closeConversation({
            accessToken: params.accessToken,
            conversationId: params.conversationId,
            adminId: params.adminId,
          });
        }

        this.logger.info('Message sent successfully', {
          conversationId: params.conversationId,
        });
      }, 'sendMessage');
    });
  }

  /**
   * Adds a note to an Intercom conversation with circuit breaker protection
   */
  async addNote(params: AddNoteParams): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      return retryAsyncOperation(async () => {
        this.logger.info('Adding note via Intercom', {
          conversationId: params.conversationId,
          adminId: params.adminId,
        });

        // Decrypt the access token
        const decryptedAccessToken = await this.cryptoService.decrypt(params.accessToken);

        const response = await fetch(`${this.baseUrl}/conversations/${params.conversationId}/reply`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${decryptedAccessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Intercom-Version': '2.11',
          },
          body: JSON.stringify({
            message_type: 'note',
            type: 'admin',
            admin_id: params.adminId.toString(),
            body: params.message,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Intercom API error: ${response.status} - ${errorBody}`);
        }

        this.logger.info('Note added successfully', {
          conversationId: params.conversationId,
        });
      }, 'addNote');
    });
  }

  /**
   * Cancels snooze on an Intercom conversation with circuit breaker protection
   */
  async cancelSnooze(params: CancelSnoozeParams): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      return retryAsyncOperation(async () => {
        this.logger.info('Cancelling snooze via Intercom', {
          conversationId: params.conversationId,
          adminId: params.adminId,
        });

        // Decrypt the access token
        const decryptedAccessToken = await this.cryptoService.decrypt(params.accessToken);

        const response = await fetch(`${this.baseUrl}/conversations/${params.conversationId}/parts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${decryptedAccessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Intercom-Version': '2.11',
          },
          body: JSON.stringify({
            admin_id: params.adminId,
            message_type: 'open',
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Intercom API error: ${response.status} - ${errorBody}`);
        }

        this.logger.info('Snooze cancelled successfully', {
          conversationId: params.conversationId,
        });
      }, 'cancelSnooze');
    });
  }

  /**
   * Sets snooze on an Intercom conversation with circuit breaker protection
   */
  async setSnooze(params: SetSnoozeParams): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      return retryAsyncOperation(async () => {
        this.logger.info('Setting snooze via Intercom', {
          conversationId: params.conversationId,
          adminId: params.adminId,
          unixTimestamp: params.unixTimestamp,
        });

        // Decrypt the access token
        const decryptedAccessToken = await this.cryptoService.decrypt(params.accessToken);

        const response = await fetch(`${this.baseUrl}/conversations/${params.conversationId}/parts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${decryptedAccessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Intercom-Version': '2.11',
          },
          body: JSON.stringify({
            admin_id: params.adminId,
            message_type: 'snoozed',
            snoozed_until: params.unixTimestamp,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Intercom API error: ${response.status} - ${errorBody}`);
        }

        this.logger.info('Snooze set successfully', {
          conversationId: params.conversationId,
          unixTimestamp: params.unixTimestamp,
        });
      }, 'setSnooze');
    });
  }

  /**
   * Closes an Intercom conversation with circuit breaker protection
   */
  async closeConversation(params: CloseConversationParams): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      return retryAsyncOperation(async () => {
        this.logger.info('Closing conversation via Intercom', {
          conversationId: params.conversationId,
          adminId: params.adminId,
        });

        // Decrypt the access token
        const decryptedAccessToken = await this.cryptoService.decrypt(params.accessToken);

        const response = await fetch(`${this.baseUrl}/conversations/${params.conversationId}/parts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${decryptedAccessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Intercom-Version': '2.11',
          },
          body: JSON.stringify({
            admin_id: params.adminId.toString(),
            message_type: 'close',
            type: 'admin',
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Failed to close conversation: ${response.status} - ${errorBody}`);
        }

        this.logger.info('Conversation closed successfully', {
          conversationId: params.conversationId,
        });
      }, 'closeConversation');
    });
  }

  /**
   * Gets the current circuit breaker state and metrics
   */
  getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }
}