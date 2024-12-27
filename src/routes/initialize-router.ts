import express from 'express';
import * as initializeController from '../controllers/initialize-controller';
import validateSignature from '../middleware/validate-signature-canvas-middleware';

const initializeRouter = express.Router();

initializeRouter.use(validateSignature);
initializeRouter.route('/').post(initializeController.initialize);

export default initializeRouter;
