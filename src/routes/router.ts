/**
 * Express router configuration for Snooze+ API.
 * Sets up main routing with middleware and sub-routers for different endpoints.
 * Uses /api/v1/ prefix for all API endpoints with improved naming structure.
 *
 * @module router
 * @route GET / - Welcome message
 * @route /api/v1 - Version 1 API endpoints (current)
 * @remarks
 *  - Includes 404 catch-all handler for undefined routes
 *  - IP validation middleware currently disabled (TODO)
 *  - All API endpoints are versioned under /api/v1/
 */
import express, { Request, Response } from 'express';
import v1Router from './v1/index.js';
import logger from '../config/logger-config.js';
// import validateIp from '../middleware/validate-ip-middleware.js';

const routerLogger = logger.child({ module: 'router' });
const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome message
 *     description: Returns a welcome message for the SnoozePlus API
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Welcome message
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Welcome to Snooze+"
 */
router.route('/').get((_req: Request, res: Response) => {
  const welcomeMessage = 'Welcome to Snooze+';
  const apiDocsMessage =
    process.env.NODE_ENV !== 'production'
      ? '\n\nAPI Documentation: /api-docs'
      : '';
  res.status(200).send(welcomeMessage + apiDocsMessage);
});

// TODO: Enable validateIp middleware.
// Apply validateIp middleware to below routes.
// router.use(validateIp);

// All API endpoints are versioned under /api/v1/
router.use('/api/v1', v1Router);

// Catch all undefined routes and respond with 404
router.use((req: Request, res: Response) => {
  routerLogger.warn(`Undefined route accessed: ${req.originalUrl}`);
  res.status(404).send('Not Found');
});

export default router;
