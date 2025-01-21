import config from './config/config.js';
import express from 'express';
import session from 'express-session';
import schedule from 'node-schedule';
import passport from 'passport';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import pool from './config/db-config.js';
import logger, { logtail } from './config/logger-config.js';
import { morganMiddleware } from './middleware/logger-middleware.js';
import router from './routes/router.js';
import scheduleJobs from './utilities/scheduler-utility.js';
import './config/auth-config.js';

const app = express();

// Define __filename and __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(morganMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));
app.use(express.static(path.join(__dirname)));

// Configure session and add passport.
const sessionSecret = config.sessionSecret;
app.use(
  session({ secret: sessionSecret, resave: false, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

app.use('/', router);

const appLogger = logger.child({ module: 'app' });
appLogger.info('*** Starting SnoozePlus Intercom Integration ***');

// Start the scheduler for sending messages.
void (async () => {
  try {
    await scheduleJobs();
    appLogger.info('Message scheduler is running.');
  } catch (err) {
    appLogger.error(`Failed to start message scheduler: ${String(err)}`);
    process.exit(1);
  }
})();

const server = app
  .listen(config.port, () => {
    appLogger.info('Express server is running.');
    appLogger.info(`Application is ready at port: ${config.port}`);
  })
  .on('error', (err) => {
    appLogger.error(`Error occurred, server can't start: ${err.message}`);
    appLogger.debug(`Error name: ${err.name}, stack: ${err.stack}`);
  });

process.on('SIGTERM', () => {
  appLogger.info('SIGTERM signal received: shutting down application.');
  server.close((err) => {
    if (err) {
      appLogger.error(`Error closing server: ${String(err)}`);
      process.exit(1);
    }
    void (async () => {
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
    })();
  });
});
