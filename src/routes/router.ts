import express from 'express';
import authRouter from './auth-router';
import healthcheckRouter from './healthcheck-router';
import initializeRouter from './initialize-router';
import submitRouter from './submit-router';
import webhookRouter from './webhook-router';

const router = express.Router();

router.use('/', healthcheckRouter);
router.use('/auth', authRouter);
router.use('/initialize', initializeRouter);
router.use('/submit', submitRouter);
router.use('/webhook', webhookRouter);

export default router;
