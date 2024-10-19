import express from 'express';
import morgan from 'morgan';
import path from 'path';
import logger from './config/logger-config';
import router from './routes/router';
import { pool } from './config/db-config';

const app = express();
const PORT = 8706;

const morganMiddleware = morgan('tiny', {
  stream: {
    // Configure Morgan to logger with the http severity.
    write: (message) => logger.http(message.trim()),
  },
});

app.use(morganMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));
app.use(express.static(path.join(__dirname)));

app.use('/', router);

const server = app
  .listen(PORT, () => {
    logger.info('*** SnoozePlus Intercom Integration ***');
    logger.info('Express server is running');
    const address = server.address();
    const port = typeof address === 'string' ? address : address?.port;
    logger.info(`App is ready at port: ${port}`);
  })
  .on('error', (err) => {
    logger.error(`Error occurred, server can't start: ${err}`);
  });

process.on('SIGTERM', () => {
  logger.debug('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    logger.info('Draining DB pool');
    await pool.end();
    logger.info('DB pool drained');
    logger.info('HTTP server closed');
  });
});
