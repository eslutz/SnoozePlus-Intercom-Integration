import { injectable, inject } from 'inversify';
import { RequestHandler, Request, Response } from 'express';
import { Logger } from 'winston';
import { Workspace } from '../models/workspace-model.js';
import { TYPES } from '../container/types.js';
import type {
  IMessageService,
  IWorkspaceService,
  IIntercomService,
} from '../container/interfaces.js';
import {
  createSnoozeRequest,
  setSnoozeCanceledNote,
} from '../utilities/snooze-utility.js';
import { IntercomCanvasRequest } from '../models/intercom-request-canvas-model.js';
import { asyncHandler, AppError } from '../middleware/error-middleware.js';
import { CanvasService } from '../services/canvas-service-new.js';

/**
 * Injectable submit controller for handling canvas submissions
 */
@injectable()
export class SubmitController {
  constructor(
    @inject(TYPES.MessageService) private messageService: IMessageService,
    @inject(TYPES.WorkspaceService) private workspaceService: IWorkspaceService,
    @inject(TYPES.IntercomService) private intercomService: IIntercomService,
    @inject(TYPES.CanvasService) private canvasService: CanvasService,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  /**
   * Handle canvas submit requests from Intercom.
   * Processes different types of canvas submissions (snooze, cancel) and
   * coordinates with services to handle the requested actions.
   *
   * @param req - Express request object containing canvas submission data
   * @param res - Express response object for sending response canvas
   * @returns Promise that resolves when the submission is processed
   * @throws {AppError} When validation fails or processing encounters errors
   */
  public submit: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const logger = this.logger.child({ module: 'submit-controller' });

      logger.info('Submit request received.');
      logger.profile('submit');

      const canvasRequest = req.body as IntercomCanvasRequest;
      logger.info(`Request type: ${canvasRequest.component_id}`);
      logger.debug(`POST request body: ${JSON.stringify(req.body)}`);

      const workspaceId = canvasRequest.workspace_id;
      logger.debug(`workspace_id: ${workspaceId}`);
      const conversationId = Number(canvasRequest.conversation.id);
      logger.debug(`conversation:id: ${conversationId}`);

      try {
        // Retrieve user based on workspace_id
        const user = await this.workspaceService.getWorkspace(workspaceId);
        if (!user) {
          throw new AppError(
            `User not found. Workspace ID: ${workspaceId}`,
            404
          );
        }

        logger.debug(`User found: ${JSON.stringify(user)}`);

        // Process different submission types
        switch (canvasRequest.component_id) {
          case 'set_snoozes':
            this.handleSetSnoozes(canvasRequest, logger, res);
            break;

          case 'submit_snoozes':
            await this.handleSubmitSnoozes(
              canvasRequest,
              workspaceId,
              conversationId,
              user,
              logger,
              res
            );
            break;

          case 'cancel':
          case 'cancel_snoozes':
            await this.handleCancelSnoozes(
              workspaceId,
              conversationId,
              user,
              logger,
              res
            );
            break;

          default:
            logger.warn(`Unknown component_id: ${canvasRequest.component_id}`);
            throw new AppError(
              `Unknown component_id: ${canvasRequest.component_id}`,
              400
            );
        }

        logger.profile('submit', {
          level: 'info',
          message: 'Completed submit request.',
        });
      } catch (error) {
        logger.error('Submit request failed', {
          workspaceId,
          conversationId,
          componentId: canvasRequest.component_id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }
  );

  /**
   * Handle setting snoozes - show canvas for message input
   *
   * @param canvasRequest - The validated canvas request from Intercom
   * @param logger - Logger instance for request tracking
   * @param res - Express response object
   * @returns void - Synchronously sends the canvas response
   * @throws {AppError} When number of snoozes is invalid or canvas generation fails
   */
  private handleSetSnoozes(
    canvasRequest: IntercomCanvasRequest,
    logger: Logger,
    res: Response
  ): void {
    logger.info('Handling set snoozes request');

    const numOfSnoozes = parseInt(
      String(canvasRequest.input_values?.numOfSnoozes || '1'),
      10
    );
    logger.debug(`Number of snoozes: ${numOfSnoozes}`);

    if (numOfSnoozes < 1 || numOfSnoozes > 5) {
      throw new AppError(
        'Invalid number of snoozes. Must be between 1 and 5.',
        400
      );
    }

    logger.info('Building set snooze canvas.');
    logger.profile('setSnoozeCanvas');

    const setSnoozeCanvas = this.canvasService.getSetSnoozeCanvas(numOfSnoozes);

    logger.profile('setSnoozeCanvas', {
      level: 'info',
      message: 'Completed set snooze canvas.',
    });
    logger.debug(`Set snooze canvas: ${JSON.stringify(setSnoozeCanvas)}`);

    res.send(setSnoozeCanvas);
  }

  /**
   * Handle submitting snoozes - save messages and schedule them
   *
   * @param canvasRequest - The validated canvas request from Intercom
   * @param workspaceId - The workspace identifier
   * @param conversationId - The conversation identifier
   * @param user - The workspace configuration with authentication details
   * @param logger - Logger instance for request tracking
   * @param res - Express response object
   * @returns Promise that resolves when the snooze request is processed
   */
  private async handleSubmitSnoozes(
    canvasRequest: IntercomCanvasRequest,
    workspaceId: string,
    conversationId: number,
    user: Workspace,
    logger: Logger,
    res: Response
  ): Promise<void> {
    logger.info('Handling submit snoozes request');

    // Create snooze request from canvas input
    logger.info('Creating snooze request.');
    logger.profile('createSnoozeRequest');

    const snoozeRequest = await createSnoozeRequest(
      canvasRequest.input_values || {}
    );

    logger.profile('createSnoozeRequest', {
      level: 'info',
      message: 'Snooze request created.',
    });
    logger.debug(`Snooze request: ${JSON.stringify(snoozeRequest)}`);

    // Save messages to database
    logger.info('Saving messages to database.');
    logger.profile('saveMessages');

    const messageResponse = await this.messageService.saveMessages(
      workspaceId,
      conversationId,
      snoozeRequest.messages
    );

    logger.profile('saveMessages', {
      level: 'info',
      message: 'Messages saved to the database.',
    });
    logger.debug(`Save Messages response: ${JSON.stringify(messageResponse)}`);

    // Build final canvas with summary
    logger.info('Building final canvas.');
    logger.profile('finalCanvas');

    const messages = await this.messageService.getMessages(
      workspaceId,
      conversationId
    );
    const finalCanvas = await this.canvasService.getFinalCanvas(messages);

    logger.profile('finalCanvas', {
      level: 'info',
      message: 'Completed final canvas.',
    });
    logger.debug(`Final canvas: ${JSON.stringify(finalCanvas)}`);

    // Add a note to the conversation with summary
    logger.info('Adding snooze summary note to conversation.');
    logger.profile('addNote');

    const noteMessage = `📝 Snooze+ Summary: ${messages.length} message${messages.length === 1 ? '' : 's'} scheduled for this conversation.`;

    await this.intercomService.addNote({
      adminId: user.adminId,
      accessToken: user.accessToken,
      conversationId: conversationId,
      message: noteMessage,
    });

    logger.profile('addNote', {
      level: 'info',
      message: 'Note added to conversation.',
    });

    res.send(finalCanvas);
  }

  /**
   * Handle cancelling snoozes - archive messages and reset to initial state
   *
   * @param workspaceId - The workspace identifier
   * @param conversationId - The conversation identifier
   * @param user - The workspace configuration with authentication details
   * @param logger - Logger instance for request tracking
   * @param res - Express response object
   * @returns Promise that resolves when the snooze cancellation is processed
   */
  private async handleCancelSnoozes(
    workspaceId: string,
    conversationId: number,
    user: Workspace,
    logger: Logger,
    res: Response
  ): Promise<void> {
    logger.info('Handling cancel snoozes request');

    // Check if there are messages to cancel
    const messages = await this.messageService.getMessages(
      workspaceId,
      conversationId
    );

    if (messages.length > 0) {
      // Archive messages associated with conversation
      logger.info(
        'Archiving messages associated with conversation from database.'
      );
      logger.profile('archiveMessages');

      const messagesArchived = await this.messageService.archiveMessages(
        workspaceId,
        conversationId
      );

      logger.profile('archiveMessages', {
        level: 'info',
        message: `Messages archived: ${messagesArchived}`,
      });
      logger.debug(
        `Messages archived response: ${JSON.stringify(messagesArchived)}`
      );

      // Cancel snooze in Intercom if conversation was snoozed
      logger.info('Unsnoozing conversation.');
      logger.profile('unsnooze');

      await this.intercomService.cancelSnooze({
        adminId: user.adminId,
        accessToken: user.accessToken,
        conversationId: conversationId,
      });

      logger.profile('unsnooze', {
        level: 'info',
        message: 'Conversation unsnoozed.',
      });

      // Add cancellation note to conversation
      logger.info('Creating cancellation note for the conversation.');
      logger.profile('setCanceledNote');

      const cancelNote = setSnoozeCanceledNote(messagesArchived);
      await this.intercomService.addNote({
        adminId: user.adminId,
        accessToken: user.accessToken,
        conversationId: conversationId,
        message: cancelNote,
      });

      logger.profile('setCanceledNote', {
        level: 'info',
        message: 'Cancellation note added.',
      });
    }

    // Reset to original canvas
    logger.info('Resetting to initial canvas.');
    logger.profile('initialCanvas');

    const initialCanvas = this.canvasService.getInitialCanvas();

    logger.profile('initialCanvas', {
      level: 'info',
      message: 'Completed cancel snooze request.',
    });

    res.send(initialCanvas);
  }
}
