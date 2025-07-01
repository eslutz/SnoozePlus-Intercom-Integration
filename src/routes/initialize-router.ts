/**
 * Express router for routing Intercom Canvas Kit initialization routes.
 *
 * @module initializeRouter
 * @route POST / - Initializes the application
 * @middleware validateSignature - Authenticates requests from Intercom Canvas Kit
 * @middleware rateLimitConfigs.canvas - Rate limiting for canvas interactions
 * @middleware requestSizeLimits.canvas - Request size limiting
 * @middleware validateSchema - Enhanced input validation with XSS protection
 */
import express from 'express';
import * as initializeController from '../controllers/initialize-controller.js';
import validateSignature from '../middleware/validate-signature-canvas-middleware.js';
import { rateLimitConfigs } from '../middleware/advanced-rate-limiting.js';
import { requestSizeLimits } from '../middleware/request-size-limiting.js';
import {
  validateSchema,
  enhancedSchemas,
} from '../middleware/enhanced-validation-middleware.js';

const initializeRouter = express.Router();

// Apply security middleware in order
initializeRouter.use(rateLimitConfigs.canvas); // Rate limiting first
initializeRouter.use(requestSizeLimits.canvas); // Size limiting
initializeRouter.use(validateSignature); // Signature validation
initializeRouter.use(validateSchema(enhancedSchemas.canvas, 'body')); // Enhanced input validation

/**
 * @swagger
 * /initialize:
 *   post:
 *     summary: Initialize Intercom Canvas
 *     description: Initializes the Intercom Canvas Kit component and returns the initial form configuration
 *     tags: [Canvas]
 *     security:
 *       - intercomWebhook: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IntercomCanvas'
 *           example:
 *             canvas_id: "canvas_123456"
 *             current_submitter:
 *               type: "admin"
 *               id: "admin_123"
 *               name: "John Doe"
 *               email: "john@example.com"
 *             input_values: {}
 *     responses:
 *       200:
 *         description: Canvas initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 canvas:
 *                   type: object
 *                   properties:
 *                     content:
 *                       type: object
 *                       properties:
 *                         components:
 *                           type: array
 *                           description: Canvas form components
 *                         disabled:
 *                           type: boolean
 *                           description: Whether the form is disabled
 *             example:
 *               canvas:
 *                 content:
 *                   components:
 *                     - type: "input"
 *                       id: "message"
 *                       label: "Snooze Message"
 *                       placeholder: "Enter your message..."
 *                     - type: "input"
 *                       id: "delay"
 *                       label: "Delay (minutes)"
 *                       placeholder: "Enter delay in minutes"
 *                   disabled: false
 *       400:
 *         description: Invalid request body or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid webhook signature
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
initializeRouter.route('/').post(initializeController.initialize);

export default initializeRouter;
