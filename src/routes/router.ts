import express from 'express';
import authRouter from './auth-router';
import healthcheckRouter from './healthcheck-router';
import initializeRouter from './initialize-router';
import submitRouter from './submit-router';
import webhookRouter from './webhook-router';
import logger from '../config/logger-config';
import validateIp from '../middleware/validate-ip-middleware';

const routerLogger = logger.child({ module: 'router' });
const router = express.Router();

router.route('/').get((_req, res) => {
  res.status(200).send('Welcome to Snooze+');
});
router.use('/auth', authRouter);

// Apply validateIp middleware to below routes
router.use(validateIp);

router.use('/healthcheck', healthcheckRouter);
router.use('/initialize', initializeRouter);
router.use('/submit', submitRouter);
router.use('/webhook', webhookRouter);

// Catch all undefined routes and respond with 404
router.use((req, res) => {
  routerLogger.warn(`Undefined route accessed: ${req.originalUrl}`);
  res.status(404).send('Not Found');
});

export default router;
