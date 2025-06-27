/**
 * Express router configuration for Snooze+ API.
 * Sets up main routing with middleware and sub-routers for different endpoints.
 *
 * @module router
 * @route GET / - Welcome message
 * @route /auth - Authentication related routes
 * @route /healthcheck - Health check endpoints
 * @route /initialize - Initialization endpoints
 * @route /submit - Form submission endpoints
 * @route /webhook - Webhook handling endpoints
 * @remarks
 *  - Includes 404 catch-all handler for undefined routes
 *  - IP validation middleware currently disabled (TODO)
 */
import express, { Request, Response } from 'express';
import authRouter from './auth-router.js';
import healthcheckRouter from './healthcheck-router.js';
import initializeRouter from './initialize-router.js';
import submitRouter from './submit-router.js';
import webhookRouter from './webhook-router.js';
import logger from '../config/logger-config.js';
// import validateIp from '../middleware/validate-ip-middleware.js';

const routerLogger = logger.child({ module: 'router' });
const router = express.Router();

router.route('/').get((_req: Request, res: Response) => {
  res.status(200).send('Welcome to Snooze+');
});
router.use('/auth', authRouter);

// TODO: Enable validateIp middleware.
// Apply validateIp middleware to below routes.
// router.use(validateIp);

router.use('/healthcheck', healthcheckRouter);
router.use('/initialize', initializeRouter);
router.use('/submit', submitRouter);
router.use('/webhook', webhookRouter);

// Catch all undefined routes and respond with 404
router.use((req: Request, res: Response) => {
  routerLogger.warn(`Undefined route accessed: ${req.originalUrl}`);
  res.status(404).send('Not Found');
});

export default router;
