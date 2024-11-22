import express from 'express';
import authRouter from './auth-router';
import healthcheckRouter from './healthcheck-router';
import initializeRouter from './initialize-router';
import submitRouter from './submit-router';
import webhookRouter from './webhook-router';

const router = express.Router();

router.route('/').get((_req, res) => {
  // res.send('Welcome to Snooze+');
  // Responds with an html link that sends a post request to the initialize endpoint with an empty JSON payload.
  res.send(`
    <form action="/initialize" method="post" style="font-size: 20px;">
      <button type="submit">Click here to initialize the app</button>
    </form>
  `);
});

router.use('/auth', authRouter);
router.use('/healthcheck', healthcheckRouter);
router.use('/initialize', initializeRouter);
router.use('/submit', submitRouter);
router.use('/webhook', webhookRouter);

export default router;
