import express from 'express';
import * as submitController from '../controllers/submit-controller.js';
import validateSignature from '../middleware/validate-signature-canvas-middleware.js';

const submitRouter = express.Router();

submitRouter.use(validateSignature);
submitRouter.route('/').post(submitController.submit);

export default submitRouter;
