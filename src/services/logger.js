const winston = require('winston');

const logger = winston.createLogger({
  level: 'debug',
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
});

module.exports = logger;
