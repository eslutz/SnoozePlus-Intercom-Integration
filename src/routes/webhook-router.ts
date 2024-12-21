import express from 'express';
import * as webhookController from '../controllers/webhook-controller';
import validateIp from '../middleware/validate-ip-middleware';
import validateSignature from '../middleware/validate-webhook-signature-middleware';

const webhookRouter = express.Router();

webhookRouter
  .route('/')
  .head(validateIp, validateSignature, webhookController.validate)
  .post(validateIp, validateSignature, webhookController.receiver);

export default webhookRouter;
