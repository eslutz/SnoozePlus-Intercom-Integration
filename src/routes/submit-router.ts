import express from 'express';
import * as submitController from '../controllers/submit-controller';
import validateIp from '../middleware/validate-ip-middleware';
import validateSignature from '../middleware/validate-signature-canvas-middleware';

const submitRouter = express.Router();

submitRouter
  .route('/')
  .post(validateIp, validateSignature, submitController.submit);

export default submitRouter;
