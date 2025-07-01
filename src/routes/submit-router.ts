/**
 * Express router for routing Intercom Canvas Kit submit requests.
 *
 * @module submitRouter
 * @route POST / - Submits the form
 * @middleware validateSignature - Authenticates requests from Intercom Canvas Kit
 * @middleware rateLimitConfigs.canvas - Rate limiting for canvas interactions
 * @middleware requestSizeLimits.canvas - Request size limiting
 * @middleware validateSchema - Enhanced input validation with XSS protection
 */
import express from 'express';
import * as submitController from '../controllers/submit-controller.js';
import validateSignature from '../middleware/validate-signature-canvas-middleware.js';
import { rateLimitConfigs } from '../middleware/advanced-rate-limiting.js';
import { requestSizeLimits } from '../middleware/request-size-limiting.js';
import {
  validateSchema,
  enhancedSchemas,
} from '../middleware/enhanced-validation-middleware.js';

const submitRouter = express.Router();

// Apply security middleware in order
submitRouter.use(rateLimitConfigs.canvas); // Rate limiting first
submitRouter.use(requestSizeLimits.canvas); // Size limiting
submitRouter.use(validateSignature); // Signature validation
submitRouter.use(validateSchema(enhancedSchemas.canvasSubmission, 'body')); // Enhanced input validation

/**
 * @swagger
 * /submit:
 *   post:
 *     summary: Submit Intercom Canvas form
 *     description: Processes form submissions from Intercom Canvas Kit to create snooze requests
 *     tags: [Canvas, Snooze]
 *     security:
 *       - intercomWebhook: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/IntercomCanvas'
 *               - type: object
 *                 properties:
 *                   input_values:
 *                     type: object
 *                     properties:
 *                       message:
 *                         type: string
 *                         description: Message content to be sent after delay
 *                       delay:
 *                         type: string
 *                         description: Delay in minutes before sending message
 *                       conversation_id:
 *                         type: string
 *                         description: Intercom conversation ID
 *                     required: [message, delay, conversation_id]
 *           example:
 *             canvas_id: "canvas_123456"
 *             current_submitter:
 *               type: "admin"
 *               id: "admin_123"
 *               name: "John Doe"
 *             input_values:
 *               message: "Thank you for your patience. We'll get back to you soon."
 *               delay: "60"
 *               conversation_id: "conversation_123456"
 *     responses:
 *       200:
 *         description: Snooze request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Snooze request created successfully"
 *                 snoozeId:
 *                   type: string
 *                   description: Unique identifier for the created snooze request
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
submitRouter.route('/').post(submitController.submit);

export default submitRouter;
