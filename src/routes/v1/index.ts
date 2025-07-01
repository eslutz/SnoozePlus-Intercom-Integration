/**
 * Version 1 API routes for backward compatibility.
 *
 * @module routes/v1/index
 * @route /healthcheck - Health check endpoints
 * @route /auth - Authentication routes
 * @route /submit - Form submission endpoints
 * @route /webhook - Webhook handling endpoints
 * @route /initialize - Initialization endpoints
 */
import { Router } from 'express';
import healthcheckRouter from '../healthcheck-router.js';
import authRouter from '../auth-router.js';
import submitRouter from '../submit-router.js';
import webhookRouter from '../webhook-router.js';
import initializeRouter from '../initialize-router.js';

const v1Router = Router();

// Version 1 routes - using existing implementations
v1Router.use('/healthcheck', healthcheckRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/submit', submitRouter);
v1Router.use('/webhook', webhookRouter);
v1Router.use('/initialize', initializeRouter);

export default v1Router;
