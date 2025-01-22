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
import validateSignature from '../middleware/validate-signature-canvas-middleware.js';

const healthcheckRouter = express.Router();

healthcheckRouter.route('/').get(healthcheckController.healthcheck);
healthcheckRouter
  .route('/db-healthcheck')
  .get(healthcheckController.dbHealthcheck);
healthcheckRouter
  .route('/installation-healthcheck')
  .post(validateSignature, healthcheckController.installationHealthcheck);

export default healthcheckRouter;
