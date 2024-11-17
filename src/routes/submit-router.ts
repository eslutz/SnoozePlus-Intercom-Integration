import express from 'express';
import * as submitController from '../controllers/submit-controller';
import { isLoggedIn } from '../middleware/auth-middleware';

const submitRouter = express.Router();

submitRouter.route('/').post(isLoggedIn, submitController.submit);

export default submitRouter;
