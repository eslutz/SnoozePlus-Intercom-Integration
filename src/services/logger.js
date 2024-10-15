'use strict';

const winston = require('winston');

// TODO: uncomment and remove existing log level before final release.
// let logLevel = 'http';

// if (process.env.NODE_ENV !== 'production') {
//   logLevel = 'debug';
// }

let logLevel = 'debug';

const logger = winston.createLogger({
  level: logLevel,
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
});

module.exports = logger;
