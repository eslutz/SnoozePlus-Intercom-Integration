import express from 'express';
import path from 'path';
import schedule from 'node-schedule';
import pool from './config/db-config';
import logger, { morganMiddleware } from './config/logger-config';
import router from './routes/router';
import scheduleMessageSending from './utilities/scheduler-utility';

const app = express();
const PORT = 8706;

app.use(morganMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));
app.use(express.static(path.join(__dirname)));

app.use('/', router);

const appLogger = logger.child({ module: 'app' });

// Start the scheduler for sending messages.
scheduleMessageSending();

const server = app
  .listen(PORT, () => {
    appLogger.info('*** SnoozePlus Intercom Integration ***');
    appLogger.info('Express server is running');
    const address = server.address();
    const port = typeof address === 'string' ? address : address?.port;
    appLogger.info(`App is ready at port: ${port}`);
  })
  .on('error', (err) => {
    appLogger.error(`Error occurred, server can't start: ${err}`);
  });

process.on('SIGTERM', () => {
  appLogger.warn('SIGTERM signal received: shutting down application');
  server.close(async () => {
    appLogger.warn('Draining DB pool');
    await pool.end();
    appLogger.warn('DB pool drained');
    appLogger.warn('Canceling scheduled jobs');
    await schedule.gracefulShutdown();
    appLogger.warn('Scheduled jobs canceled');
    appLogger.warn('Application shut down');
  });
});
