/**
 * Express router for authentication endpoints.
 * @module authRouter
 * @route GET/POST /intercom - Login with Intercom login
 * @route GET/POST /intercom/callback - Callback for Intercom OAuth
 * @route GET /failure - Authentication failures
 * @route GET /logout - Logout of current session
 */
import express from 'express';
import * as authController from '../controllers/auth-controller.js';

const authRouter = express.Router();

/**
 * @swagger
 * /auth/intercom:
 *   get:
 *     summary: Initiate Intercom OAuth login
 *     description: Redirects user to Intercom OAuth authorization page
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Intercom OAuth page
 *         headers:
 *           Location:
 *             description: URL to Intercom OAuth authorization
 *             schema:
 *               type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Handle Intercom OAuth login (POST)
 *     description: Alternative POST endpoint for Intercom OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Intercom OAuth page
 *       500:
 *         description: Internal server error
 */
authRouter
  .route('/intercom')
  .get(authController.login)
  .post(authController.login);

/**
 * @swagger
 * /auth/intercom/callback:
 *   get:
 *     summary: Intercom OAuth callback
 *     description: Handles the callback from Intercom OAuth flow and establishes user session
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth authorization code from Intercom
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: OAuth state parameter for security
 *     responses:
 *       302:
 *         description: Successful authentication, redirect to application
 *         headers:
 *           Set-Cookie:
 *             description: Session cookie
 *             schema:
 *               type: string
 *       401:
 *         description: Authentication failed
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Handle Intercom OAuth callback (POST)
 *     description: Alternative POST endpoint for Intercom OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Successful authentication redirect
 *       401:
 *         description: Authentication failed
 */
authRouter
  .route('/intercom/callback')
  .get(authController.callback)
  .post(authController.callback);

/**
 * @swagger
 * /auth/failure:
 *   get:
 *     summary: Authentication failure page
 *     description: Displays authentication failure information
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Authentication failure page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
authRouter.route('/failure').get(authController.failure);

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Logout user
 *     description: Logs out the current user and destroys the session
 *     tags: [Authentication]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       302:
 *         description: Successful logout, redirect to home page
 *         headers:
 *           Set-Cookie:
 *             description: Cleared session cookie
 *             schema:
 *               type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.route('/logout').get(authController.logout);

export default authRouter;
