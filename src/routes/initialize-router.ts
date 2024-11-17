import express from 'express';
import * as initializeController from '../controllers/initialize-controller';
import { isLoggedIn } from '../middleware/auth-middleware';

const initializeRouter = express.Router();

initializeRouter.route('/').post(isLoggedIn, initializeController.initialize);

export default initializeRouter;
