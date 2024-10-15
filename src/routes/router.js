'use strict';

const express = require('express');
const router = express.Router();
const healthcheckController = require('../controllers/healthcheck-controller');
const initializeController = require('../controllers/initialize-controller');
const submitController = require('../controllers/submit-controller');
const webhookController = require('../controllers/webhook-controller');

router.route('/').get(healthcheckController.healthcheck);

/*
  This is an endpoint that Intercom will POST HTTP request when a teammate inserts
  the app into the inbox, or a new conversation is viewed.
*/
router.route('/initialize').post(initializeController.initialize);

/*
  When a submit action is taken in a canvas component, it will hit this endpoint.

  You can use this endpoint as many times as needed within a flow. You will need
  to set up the conditions that will show it the required canvas object based on a
  teammate's actions.
*/
router.route('/submit').post(submitController.submit);

router.route('/webhook').head(webhookController.validate);

router.route('/webhook').post(webhookController.receiver);

module.exports = router;
