import express from 'express';
import session from 'express-session';
import schedule from 'node-schedule';
import passport from 'passport';
import path from 'path';
import pool from './config/db-config';
import logger, { logtail } from './config/logger-config';
import { morganMiddleware } from './middleware/logger-middleware';
import router from './routes/router';
import scheduleJobs from './utilities/scheduler-utility';
import './config/auth-config';

const app = express();

const port = process.env.PORT;
if (!port) {
  throw new Error('PORT cannot be found!');
}

app.use(morganMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));
app.use(express.static(path.join(__dirname)));

// Configure session and add passport.
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET cannot be found!');
}
app.use(
  session({ secret: sessionSecret, resave: false, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

app.use('/', router);

const appLogger = logger.child({ module: 'app' });
appLogger.info('*** Starting SnoozePlus Intercom Integration ***');

// Start the scheduler for sending messages.
appLogger.info('Starting scheduler for sending messages.');
appLogger.profile('scheduleMessageSending');
async () => {
  await scheduleJobs();
};
appLogger.profile('scheduleMessageSending', {
  level: 'info',
  message: 'Message scheduler started.',
});

const server = app
  .listen(port, () => {
    appLogger.info('Express server is running.');
    appLogger.info(`Application is ready at port: ${port}`);
  })
  .on('error', (err) => {
    appLogger.error(`Error occurred, server can't start: ${err}`);
  });

process.on('SIGTERM', () => {
  appLogger.info('SIGTERM signal received: shutting down application.');
  server.close(async (err) => {
    if (err) {
      appLogger.error(`Error closing server: ${String(err)}`);
      process.exit(1);
    }
    try {
      appLogger.info('Draining DB pool.');
      await pool.end();
      appLogger.info('DB pool drained.');
      appLogger.info('Canceling scheduled jobs.');
      await schedule.gracefulShutdown();
      appLogger.info('Scheduled jobs canceled.');
      appLogger.info('Flushing logs.');
      await logtail.flush();
      appLogger.info('Logs flushed.');
      appLogger.info('Application shut down.');
    } catch (err) {
      appLogger.error(`Error shutting down application: ${String(err)}`);
      process.exit(1);
    }
  });
});
