import express, { RequestHandler } from 'express';
import * as authController from '../controllers/auth-controller';
import * as healthcheckController from '../controllers/healthcheck-controller';
import * as initializeController from '../controllers/initialize-controller';
import * as submitController from '../controllers/submit-controller';
import * as webhookController from '../controllers/webhook-controller';
import { isLoggedIn } from '../middleware/auth-middleware';

const router = express.Router();

router.route('/').get((_req, res) => {
  res.send('Welcome to Snooze+');
});

router.route('/auth/intercom').get(authController.login);

router.route('/auth/intercom/callback').get(authController.callback);

router.route('/auth/failure').get(authController.failure);

router.route('/logout').get(authController.logout);

/*
  Healthcheck routes for the application and database connection.
*/
router.route('/healthcheck').get(healthcheckController.healthcheck);

router.route('/db-healthcheck').get(healthcheckController.dbHealthcheck);

/*
  This is an endpoint that Intercom will POST HTTP request when a teammate inserts
  the app into the inbox, or a new conversation is viewed.
*/
router.route('/initialize').post(isLoggedIn, initializeController.initialize);

/*
  When a submit action is taken in a canvas component, it will hit this endpoint.

  You can use this endpoint as many times as needed within a flow. You will need
  to set up the conditions that will show it the required canvas object based on a
  teammate's actions.
*/
router.route('/submit').post(isLoggedIn, submitController.submit);

/*
  Webhook route for receiving events from Intercom.
*/
router.route('/webhook').head(webhookController.validate);

router.route('/webhook').post(webhookController.receiver);

export default router;
