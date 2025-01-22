/**
 * Express router for routing Intercom webhook notifications.
 *
 * @module webhookRouter
 * @route HEAD / - Validates the webhook configuration
 * @route POST / - Receives and processes webhook events
 * @middleware validateSignature - Authenticates requests from Intercom webhook notification service
 */
import express from 'express';
import * as webhookController from '../controllers/webhook-controller.js';
import validateSignature from '../middleware/validate-signature-webhook-middleware.js';

const webhookRouter = express.Router();

webhookRouter.use(validateSignature);
webhookRouter
  .route('/')
  .head(webhookController.validate)
  .post(webhookController.receiver);

export default webhookRouter;
