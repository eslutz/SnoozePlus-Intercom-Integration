import express from 'express';
import * as healthcheckController from '../controllers/healthcheck-controller.js';
import validateSignature from '../middleware/validate-signature-canvas-middleware.js';

const healthcheckRouter = express.Router();

healthcheckRouter.route('/').get(healthcheckController.healthcheck);
healthcheckRouter
  .route('/installation-healthcheck')
  .post(validateSignature, healthcheckController.installationHealthcheck);
healthcheckRouter
  .route('/db-healthcheck')
  .get(healthcheckController.dbHealthcheck);

export default healthcheckRouter;
