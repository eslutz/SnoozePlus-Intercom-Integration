/**
 * Version 1 API routes - current API version with improved endpoint naming.
 *
 * @module routes/v1/index
 * @route /health - Health check endpoints (improved naming)
 * @route /auth - Authentication routes
 * @route /messages - Message handling endpoints (improved naming)
 * @route /webhooks - Webhook handling endpoints (improved naming)
 * @route /initialize - Canvas initialization endpoints
 */
import { Router } from 'express';
import healthcheckRouter from '../healthcheck-router.js';
import authRouter from '../auth-router.js';
import submitRouter from '../submit-router.js';
import webhookRouter from '../webhook-router.js';
import initializeRouter from '../initialize-router.js';

const v1Router = Router();

// Version 1 routes with improved endpoint naming
v1Router.use('/health', healthcheckRouter); // Improved naming
v1Router.use('/auth', authRouter);
v1Router.use('/messages', submitRouter); // Improved naming for clarity
v1Router.use('/webhooks', webhookRouter); // Improved naming (pluralized)
v1Router.use('/initialize', initializeRouter); // Canvas initialization

export default v1Router;
