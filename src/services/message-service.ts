import { injectable, inject } from 'inversify';
import { Pool } from 'pg';
import { Logger } from 'winston';
import { TYPES } from '../container/types.js';
import type { IMessageService } from '../container/interfaces.js';
import { retryAsyncOperation } from '../utilities/retry-utility.js';
import { MessageDTO } from '../models/message-dto-model.js';
import {
  Message,
  mapMessageDTOToMessage,
  mapMessageDTOToMessageWithoutAuth,
} from '../models/message-model.js';
import { AppError } from '../middleware/error-middleware.js';

/**
 * Injectable message service for database operations
 */
@injectable()
export class MessageService implements IMessageService {
  constructor(
    @inject(TYPES.DatabasePool) private pool: Pool,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  /**
   * Archives a message in the database by setting its 'archived' flag to TRUE.
   * Uses retry logic to handle potential database connection issues.
   *
   * @param messageId - The unique identifier of the message to be archived
   * @returns Promise that resolves to the number of rows affected
   * @throws Error if all retry attempts fail to execute the database query
   */
  async archiveMessage(messageId: string): Promise<number> {
    this.logger.info('Archiving message', { messageId });
    
    const archiveMessageQuery = `
      UPDATE messages
      SET archived = TRUE
      WHERE id = $1;
    `;
    const archiveParameters = [messageId];

    return new Promise<number>((resolve, reject) => {
      retryAsyncOperation<number>(async () => {
        const response = await this.pool.query(archiveMessageQuery, archiveParameters);
        this.logger.debug('Message archived', { 
          messageId, 
          rowsAffected: response.rowCount 
        });
        return response.rowCount ?? 0;
      }, 'archiveMessage')
        .then(resolve)
        .catch((err: Error) => {
          this.logger.error('Error executing archive message query', { 
            messageId, 
            error: err.message 
          });
          reject(err);
        });
    });
  }

  /**
   * Archives messages in the database for a specific workspace and conversation.
   *
   * @param workspaceId - The unique identifier of the workspace
   * @param conversationId - The numeric identifier of the conversation
   * @returns Promise that resolves to the number of messages archived
   * @throws Error if the database operation fails after all retry attempts
   */
  async archiveMessages(workspaceId: string, conversationId: number): Promise<number> {
    this.logger.info('Archiving messages', { workspaceId, conversationId });
    
    const archiveMessagesQuery = `
      UPDATE messages
      SET archived = TRUE
      WHERE workspace_id = $1 AND conversation_id = $2;
    `;
    const archiveParameters = [workspaceId, conversationId];

    return new Promise<number>((resolve, reject) => {
      retryAsyncOperation<number>(async () => {
        const response = await this.pool.query(
          archiveMessagesQuery,
          archiveParameters
        );
        this.logger.debug('Messages archived', { 
          workspaceId, 
          conversationId,
          rowsAffected: response.rowCount 
        });
        return response.rowCount ?? 0;
      }, 'archiveMessages')
        .then(resolve)
        .catch((err: Error) => {
          this.logger.error('Error executing archive messages query', { 
            workspaceId, 
            conversationId,
            error: err.message 
          });
          reject(err);
        });
    });
  }

  /**
   * Retrieves messages from the database for a specific workspace and conversation.
   * The messages are ordered by send date in ascending order and excludes archived messages.
   * Implements retry logic for database operations.
   *
   * @param workspaceId - The unique identifier of the workspace
   * @param conversationId - The numeric identifier of the conversation
   * @returns Promise resolving to an array of Message objects
   * @throws Error if database operations fail after all retry attempts
   */
  async getMessages(workspaceId: string, conversationId: number): Promise<Message[]> {
    this.logger.debug('Getting messages', { workspaceId, conversationId });
    
    const selectMessages = `
      SELECT id, workspace_id, conversation_id, message, send_date, close_conversation, archived
      FROM messages
      WHERE NOT archived
        AND workspace_id = $1 AND conversation_id = $2
      ORDER BY send_date ASC;
    `;
    const selectParameters = [workspaceId, conversationId];

    return new Promise<Message[]>((resolve, reject) => {
      retryAsyncOperation<Message[]>(async () => {
        const response = await this.pool.query<MessageDTO>(
          selectMessages,
          selectParameters
        );
        const messages: Message[] = response.rows.map((row: MessageDTO) =>
          mapMessageDTOToMessageWithoutAuth(row)
        );
        this.logger.debug('Messages retrieved', { 
          workspaceId, 
          conversationId,
          messageCount: messages.length,
          messageIds: messages.map((m: Message) => m.id)
        });
        return messages;
      }, 'getMessages')
        .then(resolve)
        .catch((err: Error) => {
          this.logger.error('Error executing select messages query', { 
            workspaceId, 
            conversationId,
            error: err.message 
          });
          reject(err);
        });
    });
  }

  /**
   * Retrieves the count of unarchived messages for a specific workspace and conversation.
   *
   * @param message - The message object containing workspaceId and conversationId
   * @returns Promise that resolves to the number of remaining unarchived messages
   * @throws AppError|Error if the database query fails after all retry attempts
   */
  async getRemainingMessageCount(message: Message): Promise<number> {
    this.logger.debug('Getting remaining message count', { 
      workspaceId: message.workspaceId, 
      conversationId: message.conversationId 
    });
    
    const messageCountQuery = `
      SELECT COUNT(*)
      FROM messages
      WHERE NOT archived
        AND workspace_id = $1 AND conversation_id = $2;
    `;
    const messageCountParameters = [message.workspaceId, message.conversationId];

    return new Promise<number>((resolve, reject) => {
      retryAsyncOperation<number>(async () => {
        const response = await this.pool.query<{ count: string }>(
          messageCountQuery,
          messageCountParameters
        );
        const count = response.rows[0]?.count;
        if (count === undefined) {
          throw new AppError('Count query returned undefined result', 500);
        }
        const remainingMessages = parseInt(count, 10);
        this.logger.debug('Remaining message count retrieved', { 
          workspaceId: message.workspaceId, 
          conversationId: message.conversationId,
          remainingMessages 
        });
        return remainingMessages;
      }, 'getRemainingMessageCount')
        .then(resolve)
        .catch((err: Error) => {
          this.logger.error('Error executing count messages query', { 
            workspaceId: message.workspaceId, 
            conversationId: message.conversationId,
            error: err.message 
          });
          reject(err);
        });
    });
  }

  /**
   * Retrieves all unarchived messages scheduled to be sent before the end of the current day.
   *
   * @returns Promise that resolves to an array of Message objects
   * @throws Error if all retry attempts fail when querying the database
   */
  async getTodaysMessages(): Promise<Message[]> {
    this.logger.debug('Getting today\'s messages');
    
    const selectMessages = `
      SELECT m.id, m.workspace_id, m.conversation_id, m.message, m.send_date, m.close_conversation, m.archived,
             u.admin_id, u.access_token
      FROM messages m
      INNER JOIN users u ON m.workspace_id = u.workspace_id
      WHERE NOT m.archived
        AND m.send_date < CURRENT_DATE + INTERVAL '1 day';
    `;

    return new Promise<Message[]>((resolve, reject) => {
      retryAsyncOperation<Message[]>(async () => {
        const response = await this.pool.query<
          MessageDTO & { admin_id: number; access_token: string }
        >(selectMessages);
        const messages = response.rows.map(
          (row: MessageDTO & { admin_id: number; access_token: string }) =>
            mapMessageDTOToMessage(row, row.admin_id, row.access_token)
        );
        this.logger.debug('Today\'s messages retrieved', { 
          messageCount: messages.length,
          messageIds: messages.map((m: Message) => m.id)
        });
        return messages;
      }, 'getTodaysMessages')
        .then(resolve)
        .catch((err: Error) => {
          this.logger.error('Error executing select messages query', { 
            error: err.message 
          });
          reject(err);
        });
    });
  }

  /**
   * Saves multiple messages to the database for a given workspace and conversation.
   * Uses retry logic for handling transient database errors.
   *
   * @param workspaceId - The unique identifier of the workspace
   * @param conversationId - The numeric identifier of the conversation
   * @param messages - Array of Message objects to be saved
   * @returns Promise resolving to an array of message GUIDs
   * @throws Error if database operations fail after retry attempts
   */
  async saveMessages(
    workspaceId: string,
    conversationId: number,
    messages: Message[]
  ): Promise<string[]> {
    this.logger.info('Saving messages', { 
      workspaceId, 
      conversationId, 
      messageCount: messages.length 
    });
    
    let messageGUIDs: string[] = [];

    const promises = messages.map((message): Promise<string> => {
      const insertMessage = `
        INSERT INTO messages (workspace_id, conversation_id, message, send_date, close_conversation)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `;
      const messageParameters = [
        workspaceId,
        conversationId,
        message.message,
        message.sendDate.toISOString(),
        message.closeConversation,
      ];

      return retryAsyncOperation<string>(async () => {
        const response = await this.pool.query<{ id: string }>(
          insertMessage,
          messageParameters
        );
        const id = response.rows[0]?.id;
        if (typeof id !== 'string') {
          throw new AppError(
            'Insert message query returned invalid or missing id',
            500
          );
        }
        return id;
      }, 'saveMessages');
    });

    try {
      messageGUIDs = await Promise.all(promises);
      this.logger.info('Messages saved successfully', { 
        workspaceId, 
        conversationId,
        messageCount: messageGUIDs.length,
        messageIds: messageGUIDs
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error('Error saving messages', { 
        workspaceId, 
        conversationId,
        error: error.message 
      });
      throw error;
    }

    return messageGUIDs;
  }
}