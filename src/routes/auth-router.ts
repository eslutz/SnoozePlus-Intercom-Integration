import express from 'express';
import * as authController from '../controllers/auth-controller';

const authRouter = express.Router();

authRouter
  .route('/intercom')
  .get(authController.login)
  .post(authController.login);
authRouter
  .route('/intercom/callback')
  .get(authController.callback)
  .post(authController.callback);
authRouter.route('/failure').get(authController.failure);
authRouter.route('/logout').get(authController.logout);

export default authRouter;
