/**
 * Version 2 API routes with improved endpoint names and structure.
 *
 * @module routes/v2/index
 * @route /health - Health check endpoints (renamed from /healthcheck)
 * @route /auth - Authentication routes
 * @route /messages - Message handling endpoints (renamed from /submit)
 * @route /webhooks - Webhook handling endpoints (pluralized)
 * @route /initialize - Initialization endpoints
 */
import { Router } from 'express';
import healthcheckRouter from '../healthcheck-router.js';
import authRouter from '../auth-router.js';
import submitRouter from '../submit-router.js';
import webhookRouter from '../webhook-router.js';
import initializeRouter from '../initialize-router.js';

const v2Router = Router();

// Version 2 routes with improved naming
v2Router.use('/health', healthcheckRouter); // Renamed endpoint
v2Router.use('/auth', authRouter);
v2Router.use('/messages', submitRouter); // Renamed for clarity
v2Router.use('/webhooks', webhookRouter); // Pluralized
v2Router.use('/initialize', initializeRouter);

export default v2Router;
