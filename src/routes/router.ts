import express from 'express';
import initialize from '../controllers/initialize-controller';
import submit from '../controllers/submit-controller';
import { receiver, validate } from '../controllers/webhook-controller';
import {
  healthcheck,
  dbHealthcheck,
} from '../controllers/healthcheck-controller';

const router = express.Router();

/*
  Healthcheck routes for the application and database connection.
*/
router.route('/').get(healthcheck);

router.route('/db-healthcheck').get(dbHealthcheck);

/*
  This is an endpoint that Intercom will POST HTTP request when a teammate inserts
  the app into the inbox, or a new conversation is viewed.
*/
router.route('/initialize').post(initialize);

/*
  When a submit action is taken in a canvas component, it will hit this endpoint.

  You can use this endpoint as many times as needed within a flow. You will need
  to set up the conditions that will show it the required canvas object based on a
  teammate's actions.
*/
router.route('/submit').post(submit);

/*
  Webhook route for receiving events from Intercom.
*/
router.route('/webhook').head(validate);

router.route('/webhook').post(receiver);

export default router;
