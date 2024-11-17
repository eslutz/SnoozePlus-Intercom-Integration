import express from 'express';
import * as healthcheckController from '../controllers/healthcheck-controller';

const healthcheckRouter = express.Router();

healthcheckRouter.route('/').get(healthcheckController.healthcheck);
healthcheckRouter
  .route('/db-healthcheck')
  .get(healthcheckController.dbHealthcheck);

export default healthcheckRouter;
