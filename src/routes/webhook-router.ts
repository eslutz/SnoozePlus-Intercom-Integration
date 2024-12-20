import express from 'express';
import * as webhookController from '../controllers/webhook-controller';
import validateIp from '../middleware/validate-ip-middleware';

const webhookRouter = express.Router();

webhookRouter
  .route('/')
  .head(validateIp, webhookController.validate)
  .post(validateIp, webhookController.receiver);

export default webhookRouter;
