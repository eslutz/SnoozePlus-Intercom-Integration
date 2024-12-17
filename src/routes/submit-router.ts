import express from 'express';
import * as submitController from '../controllers/submit-controller';
import validateSignature from '../middleware/validate-signature-middleware';

const submitRouter = express.Router();

submitRouter.route('/').post(validateSignature, submitController.submit);

export default submitRouter;
