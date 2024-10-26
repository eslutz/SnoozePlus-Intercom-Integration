import { RequestHandler } from 'express';
import logger from '../config/logger-config';
import { addNote } from '../services/intercom-service';
import * as messageService from '../services/message-db-service';
import { setCloseNote } from '../utilities/snooze-utility';

const webhookLogger = logger.child({
  module: 'webhook-controller',
});

// HEAD: /webhook - Receive webhook request to validate endpoint.
const validate: RequestHandler = async (req, res, next) => {
  try {
    webhookLogger.debug(
      `HEAD request headers: ${JSON.stringify(req.headers)}}`
    );
    res.status(200).send();
  } catch (err) {
    webhookLogger.error(`An error occurred: ${err}`);
    res.status(500).send();
    next(err);
  }
};

// POST: /webhook - Receive webhook notifications.
const receiver: RequestHandler = async (req, res, next) => {
  webhookLogger.info('Webhook notification received.');
  webhookLogger.profile('receiver');
  res.status(200).send('Webhook notification received.');

  const fullTopic: string = req.body.topic;
  const topic: string = fullTopic.substring(fullTopic.lastIndexOf('.') + 1);
  const noteRequest: NoteRequest = {
    adminId: req.body.data.item.admin_assignee_id,
    conversationId: req.body.data.item.id,
    note: '',
  };
  let messagesArchived: number = 0;
  webhookLogger.debug(`Webhook notification topic: ${fullTopic}`);

  // Determine if the conversation was unsnoozed, closed, or deleted.
  try {
    if (topic === 'unsnoozed' || topic === 'closed' || topic === 'deleted') {
      // Delete messages associated with conversation from database.
      webhookLogger.info(`Conversation has been ${topic}.`);
      webhookLogger.info(
        'Archiving messages associated with conversation from database.'
      );
      webhookLogger.profile('archiveMessages');
      messagesArchived = await messageService.archiveMessages(
        noteRequest.adminId,
        noteRequest.conversationId
      );
      webhookLogger.profile('archiveMessages', {
        level: 'info',
        message: `Messages archived: ${messagesArchived}`,
      });
      webhookLogger.debug(
        `Messages archived: ${JSON.stringify(messagesArchived)}`
      );
    } else {
      // Log warning if topic is not recognized.
      webhookLogger.warn(
        `Webhook notification topic ${fullTopic} not recognized.`
      );
    }
  } catch (err) {
    webhookLogger.error(`An error occurred: ${err}`);
    res.status(500).send(`An error occurred: ${err}`);
    next(err);
  }

  // Add close note to conversation.
  webhookLogger.info('Creating closing note for the conversation.');
  webhookLogger.profile('setCloseNote');
  noteRequest.note = setCloseNote(topic, messagesArchived);
  webhookLogger.profile('setCloseNote', {
    level: 'info',
    message: 'Closing note created.',
  });
  try {
    webhookLogger.info('Adding close note to conversation.');
    webhookLogger.profile('addNote');
    const response = await addNote(noteRequest);
    webhookLogger.profile('addNote', {
      level: 'info',
      message: 'Close note added to conversation.',
    });
    webhookLogger.debug(`Add Note response: ${JSON.stringify(response)}`);
  } catch (err) {
    webhookLogger.error(`An error occurred: ${err}`);
    res.status(500).send(`An error occurred: ${err}`);
    next(err);
  }
  webhookLogger.profile('receiver', {
    level: 'info',
    message: 'Webhook notification processed.',
  });
};

export { validate, receiver };
