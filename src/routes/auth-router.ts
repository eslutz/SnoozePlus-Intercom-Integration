/**
 * Express router for authentication endpoints.
 * @module authRouter
 *
 * Routes:
 * @route GET/POST /intercom - Login with Intercom login
 * @route GET/POST /intercom/callback - Callback for Intercom OAuth
 * @route GET /failure - Authentication failures
 * @route GET /logout - Logout of current session
 */
import express from 'express';
import * as authController from '../controllers/auth-controller.js';

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
