import express from 'express';
import * as webhookController from '../controllers/webhook-controller';

const webhookRouter = express.Router();

webhookRouter
  .route('/')
  .head(webhookController.validate)
  .post(webhookController.receiver);

export default webhookRouter;
