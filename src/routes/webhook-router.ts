import express from 'express';
import * as webhookController from '../controllers/webhook-controller';
import validateSignature from '../middleware/validate-signature-webhook-middleware';

const webhookRouter = express.Router();

webhookRouter.use(validateSignature);
webhookRouter
  .route('/')
  .head(webhookController.validate)
  .post(webhookController.receiver);

export default webhookRouter;
