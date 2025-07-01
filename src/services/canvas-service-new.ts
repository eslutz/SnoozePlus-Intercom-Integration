import { injectable, inject } from 'inversify';
import { Logger } from 'winston';
import { TYPES } from '../container/types.js';
import type { ICryptoService } from '../container/interfaces.js';
import { Message } from '../models/message-model.js';
import { CanvasResponse } from '../models/intercom-canvas-model.js';
import { calculateDaysUntilSending } from '../utilities/snooze-utility.js';
import { AppError } from '../middleware/error-middleware.js';

/**
 * Injectable canvas service for creating Intercom canvas responses
 */
@injectable()
export class CanvasService {
  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.CryptoService) private cryptoService: ICryptoService
  ) {}

  /**
   * Creates and returns the initial canvas configuration for the Snooze+ Intercom integration.
   * This canvas is displayed when the app first initializes and presents the user with options
   * to select the number of conversation snoozes.
   *
   * @returns Intercom canvas configuration object containing the initial UI components
   */
  getInitialCanvas(): CanvasResponse {
    this.logger.debug('Creating initial canvas');
    
    const initialCanvas: CanvasResponse = {
      canvas: {
        content: {
          components: [
            {
              type: 'text',
              text: 'Welcome to Snooze+',
              style: 'header',
            },
            {
              type: 'text',
              text: 'To get started, first select how many times you would like to bump the conversation.',
              style: 'muted',
            },
            {
              type: 'spacer',
              size: 's',
            },
            {
              type: 'dropdown',
              id: 'numOfSnoozes',
              label: 'How many snoozes?',
              options: [
                { type: 'option', id: '1', text: '1 snooze 😴' },
                { type: 'option', id: '2', text: '2 snoozes 😴😴' },
                { type: 'option', id: '3', text: '3 snoozes 😴😴😴' },
                { type: 'option', id: '4', text: '4 snoozes 😴😴😴😴' },
                { type: 'option', id: '5', text: '5 snoozes 😴😴😴😴😴' },
              ],
            },
            {
              type: 'spacer',
              size: 's',
            },
            {
              type: 'button',
              id: 'set_snoozes',
              label: 'Set snoozes',
              style: 'primary',
              action: { type: 'submit' },
            },
          ],
        },
      },
    };

    this.logger.debug('Initial canvas created successfully');
    return initialCanvas;
  }

  /**
   * Creates canvas for setting snooze messages based on the number of snoozes selected.
   * Dynamically generates input fields for each snooze message and date.
   *
   * @param numOfSnoozes Number of snoozes to create inputs for
   * @returns Canvas configuration for message input
   */
  getSetSnoozeCanvas(numOfSnoozes: number): CanvasResponse {
    this.logger.debug('Creating set snooze canvas', { numOfSnoozes });
    
    const setSnoozeCanvas: CanvasResponse = {
      canvas: {
        content: {
          components: [
            {
              type: 'text',
              text: 'Set your snooze messages and dates',
              style: 'header',
            },
            {
              type: 'text',
              text: `Please enter the messages and dates for your ${numOfSnoozes} snooze${numOfSnoozes > 1 ? 's' : ''}:`,
              style: 'muted',
            },
            {
              type: 'spacer',
              size: 's',
            },
          ],
        },
      },
    };

    // Add input fields for each snooze
    for (let i = 1; i <= numOfSnoozes; i++) {
      // Message input
      setSnoozeCanvas.canvas.content.components.push({
        type: 'textarea',
        id: `message_${i}`,
        label: `Message ${i}`,
        placeholder: `Enter your snooze message ${i}...`,
      });

      // Date input  
      setSnoozeCanvas.canvas.content.components.push({
        type: 'textarea',
        id: `date_${i}`,
        label: `Send Date ${i}`,
        placeholder: 'YYYY-MM-DD HH:MM',
      });

      // Spacer between snoozes (except after the last one)
      if (i < numOfSnoozes) {
        setSnoozeCanvas.canvas.content.components.push({
          type: 'spacer',
          size: 'm',
        });
        setSnoozeCanvas.canvas.content.components.push({
          type: 'divider',
        });
        setSnoozeCanvas.canvas.content.components.push({
          type: 'spacer',
          size: 'm',
        });
      }
    }

    // Add final spacer and buttons
    setSnoozeCanvas.canvas.content.components.push(
      {
        type: 'spacer',
        size: 's',
      },
      {
        type: 'dropdown',
        id: 'close_conversation',
        label: 'Close conversation after last message',
        options: [
          { type: 'option', id: 'true', text: 'Yes' },
          { type: 'option', id: 'false', text: 'No' },
        ],
      },
      {
        type: 'spacer',
        size: 's',
      },
      {
        type: 'button',
        id: 'submit_snoozes',
        label: 'Schedule messages',
        style: 'primary',
        action: { type: 'submit' },
      },
      {
        type: 'button',
        id: 'cancel',
        label: 'Cancel',
        style: 'secondary',
        action: { type: 'submit' },
      }
    );

    this.logger.debug('Set snooze canvas created successfully', { numOfSnoozes });
    return setSnoozeCanvas;
  }

  /**
   * Creates a canvas showing current snoozes for a conversation.
   * Displays all active messages with their send dates and days until sending.
   *
   * @param messages Array of messages to display
   * @returns Canvas showing current snooze status
   */
  async getCurrentSnoozesCanvas(messages: Message[]): Promise<CanvasResponse> {
    this.logger.debug('Creating current snoozes canvas', { messageCount: messages.length });
    
    const currentSnoozeCanvas: CanvasResponse = {
      canvas: {
        content: {
          components: [
            {
              type: 'text',
              text: 'Current Snoozes',
              style: 'header',
            },
            {
              type: 'text',
              text: `You have ${messages.length} message${messages.length === 1 ? '' : 's'} scheduled:`,
              style: 'muted',
            },
          ],
        },
      },
    };

    // Process each message
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      if (!message) {
        this.logger.warn('Skipping undefined message in current snoozes canvas', { index: i });
        continue;
      }
      
      try {
        // Decrypt the message content
        const decryptedMessage = await this.cryptoService.decrypt(message.message);
        
        // Calculate days until sending
        const daysUntilSending = calculateDaysUntilSending(message.sendDate);

        // Add message components
        currentSnoozeCanvas.canvas.content.components.push(
          {
            type: 'spacer',
            size: 'm',
          },
          {
            type: 'text',
            text: `Message ${i + 1}:`,
            style: 'header',
          },
          {
            type: 'text',
            text: decryptedMessage,
            style: 'paragraph',
          },
          {
            type: 'text',
            text: `Sending in ${daysUntilSending} day${daysUntilSending === 1 ? '' : 's'}.`,
            style: 'muted',
          }
        );

        // Add divider between messages (except after the last one)
        if (i < messages.length - 1) {
          currentSnoozeCanvas.canvas.content.components.push(
            {
              type: 'spacer',
              size: 'm',
            },
            {
              type: 'divider',
            }
          );
        }
      } catch (error) {
        this.logger.error('Error decrypting message in current snoozes canvas', {
          messageId: message.id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw new AppError('Failed to decrypt message content', 500);
      }
    }

    // Add cancel button
    currentSnoozeCanvas.canvas.content.components.push(
      {
        type: 'spacer',
        size: 'l',
      },
      {
        type: 'button',
        id: 'cancel_snoozes',
        label: 'Cancel all snoozes',
        style: 'secondary',
        action: { type: 'submit' },
      }
    );

    this.logger.debug('Current snoozes canvas created successfully', { messageCount: messages.length });
    return currentSnoozeCanvas;
  }

  /**
   * Creates a final canvas showing the summary of scheduled messages.
   * Displays confirmation that messages have been scheduled.
   *
   * @param messages Array of scheduled messages
   * @returns Canvas showing scheduling confirmation
   */
  async getFinalCanvas(messages: Message[]): Promise<CanvasResponse> {
    this.logger.debug('Creating final canvas', { messageCount: messages.length });
    
    const finalCanvas: CanvasResponse = {
      canvas: {
        content: {
          components: [
            {
              type: 'text',
              text: 'Snoozes Scheduled Successfully! 🎉',
              style: 'header',
            },
            {
              type: 'text',
              text: `${messages.length} message${messages.length === 1 ? '' : 's'} have been scheduled:`,
              style: 'muted',
            },
          ],
        },
      },
    };

    // Process each message
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      if (!message) {
        this.logger.warn('Skipping undefined message in final canvas', { index: i });
        continue;
      }
      
      try {
        // Decrypt the message content
        const decryptedMessage = await this.cryptoService.decrypt(message.message);
        
        // Calculate days until sending
        const daysUntilSending = calculateDaysUntilSending(message.sendDate);

        // Add message components
        finalCanvas.canvas.content.components.push(
          {
            type: 'spacer',
            size: 'm',
          },
          {
            type: 'text',
            text: `Message ${i + 1}:`,
            style: 'header',
          },
          {
            type: 'text',
            text: decryptedMessage,
            style: 'paragraph',
          },
          {
            type: 'text',
            text: `Sending in ${daysUntilSending} day${daysUntilSending === 1 ? '' : 's'}.`,
            style: 'muted',
          }
        );

        // Add divider between messages (except after the last one)
        if (i < messages.length - 1) {
          finalCanvas.canvas.content.components.push(
            {
              type: 'spacer',
              size: 'm',
            },
            {
              type: 'divider',
            }
          );
        }
      } catch (error) {
        this.logger.error('Error decrypting message in final canvas', {
          messageId: message.id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw new AppError('Failed to decrypt message content', 500);
      }
    }

    this.logger.debug('Final canvas created successfully', { messageCount: messages.length });
    return finalCanvas;
  }
}