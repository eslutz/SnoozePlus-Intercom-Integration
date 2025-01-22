/**
 * Express router for routing Intercom Canvas Kit submit requests.
 *
 * @module submitRouter
 * @route POST / - Submits the form
 * @middleware validateSignature - Authenticates requests from Intercom Canvas Kit
 */
import express from 'express';
import * as submitController from '../controllers/submit-controller.js';
import validateSignature from '../middleware/validate-signature-canvas-middleware.js';

const submitRouter = express.Router();

submitRouter.use(validateSignature);
submitRouter.route('/').post(submitController.submit);

export default submitRouter;
