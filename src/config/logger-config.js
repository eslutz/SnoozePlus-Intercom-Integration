'use strict';

const winston = require('winston');

// Set the log level based on environment variable or default options.
const logLevel =
  process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === 'production' ? 'http' : 'debug');

const logger = winston.createLogger({
  level: logLevel,
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
});

module.exports = logger;
