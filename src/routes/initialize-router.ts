import express from 'express';
import * as initializeController from '../controllers/initialize-controller';
import validateIp from '../middleware/validate-ip-middleware';
import validateSignature from '../middleware/validate-signature-middleware';

const initializeRouter = express.Router();

initializeRouter
  .route('/')
  .post(validateIp, validateSignature, initializeController.initialize);

export default initializeRouter;
