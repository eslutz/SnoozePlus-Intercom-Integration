import express from 'express';
import path from 'path';
import logger, { morganMiddleware } from './config/logger-config';
import router from './routes/router';
import pool from './config/db-config';

const app = express();
const PORT = 8706;

app.use(morganMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));
app.use(express.static(path.join(__dirname)));

app.use('/', router);

const appLogger = logger.child({ module: 'app' });

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
  appLogger.debug('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    appLogger.info('Draining DB pool');
    await pool.end();
    appLogger.info('DB pool drained');
    appLogger.info('HTTP server closed');
  });
});
