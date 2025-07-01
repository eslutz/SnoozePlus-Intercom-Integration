/**
 * Express router for routing Intercom webhook notifications.
 *
 * @module webhookRouter
 * @route HEAD / - Validates the webhook configuration
 * @route POST / - Receives and processes webhook events
 * @middleware validateSignature - Authenticates requests from Intercom webhook notification service
 * @middleware rateLimitConfigs.webhook - Rate limiting for webhook requests
 * @middleware requestSizeLimits.webhooks - Request size limiting
 * @middleware validateSchema - Enhanced input validation
 */
import express from 'express';
import * as webhookController from '../controllers/webhook-controller.js';
import validateSignature from '../middleware/validate-signature-webhook-middleware.js';
import { rateLimitConfigs } from '../middleware/advanced-rate-limiting.js';
import { requestSizeLimits } from '../middleware/request-size-limiting.js';
import { validateSchema, enhancedSchemas } from '../middleware/enhanced-validation-middleware.js';

const webhookRouter = express.Router();

// Apply security middleware in order
webhookRouter.use(rateLimitConfigs.webhook); // Rate limiting first
webhookRouter.use(requestSizeLimits.webhooks); // Size limiting
webhookRouter.use(validateSignature); // Signature validation
// Apply validation only to POST requests (HEAD doesn't have body)
webhookRouter.post('/', validateSchema(enhancedSchemas.webhook, 'body'));

/**
 * @swagger
 * /webhook:
 *   head:
 *     summary: Validate webhook configuration
 *     description: Validates the webhook endpoint configuration for Intercom webhook setup
 *     tags: [Webhooks]
 *     security:
 *       - intercomWebhook: []
 *     responses:
 *       200:
 *         description: Webhook configuration is valid
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
 *   post:
 *     summary: Receive webhook events
 *     description: Receives and processes webhook events from Intercom (conversation replies, assignments, etc.)
 *     tags: [Webhooks]
 *     security:
 *       - intercomWebhook: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [
 *                   "notification_event",
 *                   "conversation.admin.replied",
 *                   "conversation.admin.assigned",
 *                   "conversation.user.replied"
 *                 ]
 *                 description: Type of webhook event
 *               id:
 *                 type: string
 *                 description: Unique identifier for the event
 *               created_at:
 *                 type: integer
 *                 description: Unix timestamp when the event was created
 *               data:
 *                 type: object
 *                 properties:
 *                   item:
 *                     type: object
 *                     description: The conversation or other object that triggered the event
 *                     properties:
 *                       type:
 *                         type: string
 *                         example: "conversation"
 *                       id:
 *                         type: string
 *                         description: Conversation ID
 *                       state:
 *                         type: string
 *                         enum: ["open", "closed", "snoozed"]
 *                         description: Conversation state
 *           example:
 *             type: "notification_event"
 *             id: "notif_123456"
 *             created_at: 1672531200
 *             data:
 *               item:
 *                 type: "conversation"
 *                 id: "conversation_123456"
 *                 state: "open"
 *     responses:
 *       200:
 *         description: Webhook event processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 processed:
 *                   type: boolean
 *                   example: true
 *                 event_type:
 *                   type: string
 *                   description: The type of event that was processed
 *       400:
 *         description: Invalid webhook payload or unsupported event type
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
 *         description: Internal server error processing webhook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
webhookRouter
  .route('/')
  .head(webhookController.validate)
  .post(webhookController.receiver);

export default webhookRouter;
