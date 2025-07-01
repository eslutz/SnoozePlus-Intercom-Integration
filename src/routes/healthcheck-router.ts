/**
 * Express router for healthcheck endpoints.
 *
 * @module healthcheckRouter
 * @route GET / - Basic healthcheck endpoint to verify service is running
 * @route GET /db-healthcheck - Verifies database connection health
 * @route POST /installation-healthcheck - Validates that app has been installed in an Intercom workspace
 * @middleware validateSignature - Authenticates requests from Intercom installation healthcheck
 */
import express from 'express';
import * as healthcheckController from '../controllers/healthcheck-controller.js';
import * as monitoringController from '../controllers/monitoring-controller.js';
import validateSignature from '../middleware/validate-signature-canvas-middleware.js';

const healthcheckRouter = express.Router();

/**
 * @swagger
 * /healthcheck:
 *   get:
 *     summary: Basic health check
 *     description: Returns basic application health status and uptime information
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *             example:
 *               status: "ok"
 *               timestamp: "2025-06-28T10:30:00.000Z"
 *               uptime: 3600
 *               version: "0.0.2"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
healthcheckRouter.route('/').get(healthcheckController.healthcheck);

/**
 * @swagger
 * /healthcheck/db-healthcheck:
 *   get:
 *     summary: Database health check
 *     description: Verifies database connection and returns connection status
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: Database connection is healthy
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/HealthCheck'
 *                 - type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [connected, error]
 *                         connectionCount:
 *                           type: integer
 *             example:
 *               status: "ok"
 *               timestamp: "2025-06-28T10:30:00.000Z"
 *               database:
 *                 status: "connected"
 *                 connectionCount: 5
 *       500:
 *         description: Database connection error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
healthcheckRouter
  .route('/db-healthcheck')
  .get(healthcheckController.dbHealthcheck);

/**
 * @swagger
 * /healthcheck/installation-healthcheck:
 *   post:
 *     summary: Installation health check
 *     description: Validates that the app has been properly installed in an Intercom workspace
 *     tags: [Health Check]
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
 *             input_values: {}
 *     responses:
 *       200:
 *         description: Installation is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 installation:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "installed"
 *       400:
 *         description: Invalid request body or signature
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
healthcheckRouter
  .route('/installation-healthcheck')
  .post(validateSignature, healthcheckController.installationHealthcheck);

/**
 * @swagger
 * /healthcheck/metrics:
 *   get:
 *     summary: Prometheus metrics endpoint
 *     description: Returns Prometheus metrics for monitoring and alerting
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Prometheus metrics in text format
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: |
 *                 # HELP snoozeplus_http_requests_total Total number of HTTP requests
 *                 # TYPE snoozeplus_http_requests_total counter
 *                 snoozeplus_http_requests_total{method="GET",route="/",status_code="200",version="v1"} 1
 */
healthcheckRouter.route('/metrics').get(monitoringController.metricsEndpoint);

/**
 * @swagger
 * /healthcheck/health:
 *   get:
 *     summary: Enhanced health check
 *     description: Comprehensive health check including database, scheduler, and resource usage
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: boolean
 *                     scheduler:
 *                       type: boolean
 *                     memory:
 *                       type: boolean
 *                     uptime:
 *                       type: boolean
 *                 uptime:
 *                   type: number
 *                 version:
 *                   type: string
 *       503:
 *         description: System is unhealthy
 */
healthcheckRouter
  .route('/health')
  .get(monitoringController.enhancedHealthCheck);

/**
 * @swagger
 * /healthcheck/ready:
 *   get:
 *     summary: Readiness check
 *     description: Kubernetes readiness probe endpoint
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
healthcheckRouter.route('/ready').get(monitoringController.readinessCheck);

export default healthcheckRouter;
