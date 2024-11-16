import express from 'express';
import schedule from 'node-schedule';
import path from 'path';
import pool from './config/db-config';
import logger, { logtail } from './config/logger-config';
import { morganMiddleware } from './middleware/logger-middleware';
import router from './routes/router';
import scheduleJobs from './utilities/scheduler-utility';

const app = express();
const PORT = 8706;

app.use(morganMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));
app.use(express.static(path.join(__dirname)));

app.use('/', router);

const appLogger = logger.child({ module: 'app' });

appLogger.info('*** SnoozePlus Intercom Integration ***');

// Start the scheduler for sending messages.
appLogger.info('Starting scheduler for sending messages.');
appLogger.profile('scheduleMessageSending');
(async () => {
  await scheduleJobs();
})();
appLogger.profile('scheduleMessageSending', {
  level: 'info',
  message: 'Message scheduler started.',
});

const server = app
  .listen(PORT, () => {
    appLogger.info('Express server is running.');
    const address = server.address();
    const port = typeof address === 'string' ? address : address?.port;
    appLogger.info(`App is ready at port: ${port}`);
  })
  .on('error', (err) => {
    appLogger.error(`Error occurred, server can't start: ${err}`);
  });

process.on('SIGTERM', () => {
  appLogger.info('SIGTERM signal received: shutting down application.');
  server.close(async () => {
    appLogger.info('Draining DB pool.');
    await pool.end();
    appLogger.info('DB pool drained.');
    appLogger.info('Canceling scheduled jobs.');
    await schedule.gracefulShutdown();
    appLogger.info('Scheduled jobs canceled.');
    appLogger.info('Flushing logs.');
    logtail.flush();
    appLogger.info('Logs flushed.');
    appLogger.info('Application shut down.');
  });
});
