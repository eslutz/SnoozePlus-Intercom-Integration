import express from 'express';
import * as initializeController from '../controllers/initialize-controller';
import validateSignature from '../middleware/validate-signature-middleware';

const initializeRouter = express.Router();

initializeRouter
  .route('/')
  .post(validateSignature, initializeController.initialize);

export default initializeRouter;
