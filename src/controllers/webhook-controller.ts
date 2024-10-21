import { RequestHandler } from 'express';
import logger from '../config/logger-config';
import * as messageService from '../services/message-service';

// HEAD: /webhook - Receive webhook request to validate endpoint.
const validate: RequestHandler = async (req, res, next) => {
  try {
    logger.debug(`HEAD request headers: ${JSON.stringify(req.headers)}}`);
    res.status(200).send();
  } catch (err) {
    logger.error(`An error occurred: ${err}`);
    res.status(500).send();
    return next(err);
  }
};

// POST: /webhook - Receive webhook notifications.
const receiver: RequestHandler = async (req, res, next) => {
  try {
    const fullTopic = req.body.topic;
    const topic = fullTopic.substring(fullTopic.lastIndexOf('.') + 1);
    const adminId = req.body.data.item.admin_assignee_id;
    const conversationId = req.body.data.item.id;
    logger.info('Webhook notification received.');
    logger.debug(`Webhook notification topic: ${fullTopic}`);
    res.status(200).send('Webhook notification received.');

    if (topic === 'unsnoozed' || topic === 'closed' || topic === 'deleted') {
      logger.info(`Conversation has been ${topic}.`);
      logger.info(
        'Deleting messages associated with conversation from database.'
      );
      const response = await messageService.deleteMessages(
        adminId,
        conversationId
      );
      logger.info('Messages deleted.');
      logger.debug(`Messages deleted: ${JSON.stringify(response)}`);
    } else {
      logger.warn(`Webhook notification topic ${fullTopic} not recognized.`);
    }
  } catch (err) {
    logger.error(`An error occurred: ${err}`);
    res.status(500).send(`An error occurred: ${err}`);
    return next(err);
  }
};

export { validate, receiver };
