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
