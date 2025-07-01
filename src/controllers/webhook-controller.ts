import { RequestHandler, Request, Response } from 'express';
import logger from '../config/logger-config.js';
import { container } from '../container/container.js';
import type {
  IIntercomService,
  IMessageService,
  IWorkspaceService,
} from '../container/interfaces.js';
import { TYPES } from '../container/types.js';
import { setCloseNote } from '../utilities/snooze-utility.js';
import { IntercomWebhookRequest } from '../models/intercom-request-webhook-model.js';
import { asyncHandler, AppError } from '../middleware/error-middleware.js';

const webhookLogger = logger.child({
  module: 'webhook-controller',
});

// HEAD: /webhook - Receive webhook request to validate endpoint.
const validate: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await Promise.resolve(); // Satisfy linter for async function
    webhookLogger.debug(`HEAD request headers: ${JSON.stringify(req.headers)}`);
    res.status(200).send();
  }
);

const receiver: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    webhookLogger.info('Webhook notification received.');
    webhookLogger.profile('receiver');
    res.status(200).send('Webhook notification received.');

    const webhookRequest = req.body as IntercomWebhookRequest;
    const fullTopic: string = webhookRequest.topic;
    webhookLogger.debug(`Webhook notification full topic: ${fullTopic}`);
    const topic: string = fullTopic.substring(fullTopic.lastIndexOf('.') + 1);
    webhookLogger.debug(`Webhook notification topic: ${topic}`);
    const workspaceId: string = webhookRequest.app_id;
    webhookLogger.debug(`Webhook notification workspace_id: ${workspaceId}`);
    const conversationId: number = webhookRequest.data.item.id;
    webhookLogger.debug(
      `Webhook notification conversation_id: ${conversationId}`
    );

    // Get services from DI container
    const workspaceService = container.get<IWorkspaceService>(
      TYPES.WorkspaceService
    );
    const messageService = container.get<IMessageService>(TYPES.MessageService);
    const intercomService = container.get<IIntercomService>(
      TYPES.IntercomService
    );

    const user = await workspaceService.getWorkspace(workspaceId);
    if (!user) {
      throw new AppError(`User not found. Workspace ID: ${workspaceId}`, 404);
    }

    let messagesArchived = 0;

    // Determine if the conversation was unsnoozed, closed, or deleted.
    if (topic === 'unsnoozed' || topic === 'closed' || topic === 'deleted') {
      // Archive messages associated with conversation from database.
      webhookLogger.info(`Conversation has been ${topic}.`);
      webhookLogger.info(
        'Archiving messages associated with conversation from database.'
      );
      webhookLogger.profile('archiveMessages');
      messagesArchived = await messageService.archiveMessages(
        workspaceId,
        conversationId
      );
      webhookLogger.profile('archiveMessages', {
        level: 'info',
        message: `Messages archived: ${messagesArchived}`,
      });
      webhookLogger.debug(
        `Messages archived response: ${JSON.stringify(messagesArchived)}`
      );
    } else {
      // Log warning if topic is not recognized.
      webhookLogger.warn(
        `Webhook notification topic ${fullTopic} not recognized.`
      );
    }

    // Add close note to conversation.
    webhookLogger.info('Creating closing note for the conversation.');
    webhookLogger.profile('setCloseNote');
    webhookLogger.profile('setCloseNote', {
      level: 'info',
      message: 'Closing note created.',
    });

    webhookLogger.info('Adding close note to conversation.');
    webhookLogger.profile('addNote');
    const response = await intercomService.addNote({
      adminId: user.adminId,
      accessToken: user.accessToken,
      conversationId: conversationId,
      message: setCloseNote(topic, messagesArchived),
    });
    webhookLogger.profile('addNote', {
      level: 'info',
      message: 'Close note added to conversation.',
    });
    webhookLogger.debug(`Add Note response: ${JSON.stringify(response)}`);

    webhookLogger.profile('receiver', {
      level: 'info',
      message: 'Webhook notification processed.',
    });
  }
);

export { validate, receiver };
