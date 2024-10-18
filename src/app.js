'use strict';

const express = require('express');
const morgan = require('morgan');
const path = require('path');
const logger = require('./config/logger-config');
const router = require('./routes/router');
const { pool } = require('./config/db-config');

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

const server = app.listen(PORT, (err) => {
  if (!err) {
    logger.info('*** SnoozePlus Intercom Integration ***');
    logger.info('Express server is running');
    logger.info(`App is ready at port: ${server.address().port}`);
  } else {
    logger.error(`Error occurred, server can't start: ${err}`);
  }
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
