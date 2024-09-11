'use strict';

const express = require('express');
const morgan = require('morgan');
const path = require('path');
const logger = require('./services/logger');
const router = require('./routes/router');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

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

const listener = app.listen(PORT, (err) => {
  if (!err) {
    logger.info('*** SnoozePlus Intercom Integration ***');
    logger.info('Express server is running');
    logger.info(`App is ready at port: ${listener.address().port}`);
  } else {
    logger.error(`Error occurred, server can't start: ${err}`);
  }
});
