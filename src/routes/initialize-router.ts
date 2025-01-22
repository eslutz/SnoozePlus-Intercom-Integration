/**
 * Express router for routing Intercom Canvas Kit initialization routes.
 *
 * @module initializeRouter
 * @route POST / - Initializes the application
 * @middleware validateSignature - Authenticates requests from Intercom Canvas Kit
 */
import express from 'express';
import * as initializeController from '../controllers/initialize-controller.js';
import validateSignature from '../middleware/validate-signature-canvas-middleware.js';

const initializeRouter = express.Router();

initializeRouter.use(validateSignature);
initializeRouter.route('/').post(initializeController.initialize);

export default initializeRouter;
