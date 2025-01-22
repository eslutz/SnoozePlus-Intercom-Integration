/**
 * Logger configuration module.
 *
 * @module logger-config
 * @exports logger Configured Winston logger instance
 * @exports logtail Logtail client instance
 * @remarks This module sets up a Winston logger with the following features:
 *  - Custom severity levels (error, warn, info, http, debug)
 *  - Colored console output
 *  - JSON log format with timestamps
 *  - Daily rotating file logs in local development
 *  - Logtail integration for non-local environments
 *  - Exception and rejection handling
 */
import winston from 'winston';
import 'winston-daily-rotate-file';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import config from './config.js';

// Create the Logtail client.
const betterstackLogtailKey = config.betterstackLogtailKey;
const logtail = new Logtail(betterstackLogtailKey);

// Define severity levels.
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define custom logging level colors.
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Link custom logging colors and levels to winston.
winston.addColors(colors);

// Define log format.
const format = winston.format.combine(
  winston.format.errors({ stack: true }),
  // Add the message timestamp with the preferred format.
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  // Define message format showing the timestamp, the level and the message
  winston.format.json()
);

// Set transport option for all environments.
const transports: winston.transport[] = [
  new winston.transports.Console({
    // Add color to the console output.
    format: winston.format.colorize({ all: true }),
  }),
];
// Set exception handler transport option for all environments.
const exceptionTransports: winston.transport[] = [
  new winston.transports.Console({
    // Add color to the console output.
    format: winston.format.colorize({ all: true }),
  }),
];
// Set rejection handler transport option for all environments.
const rejectionTransports: winston.transport[] = [
  new winston.transports.Console({
    // Add color to the console output.
    format: winston.format.colorize({ all: true }),
  }),
];

// Add file transports for local dev environment.
if (config.nodeEnv === 'local') {
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '7d',
      format: winston.format.simple(),
    }),
    new winston.transports.DailyRotateFile({
      level: 'error',
      filename: 'logs/errors-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '7d',
      format: winston.format.simple(),
    })
  );
  exceptionTransports.push(
    new winston.transports.DailyRotateFile({
      filename: 'logs/exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '7d',
      format: winston.format.simple(),
    })
  );
  rejectionTransports.push(
    new winston.transports.DailyRotateFile({
      filename: 'logs/rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '7d',
      format: winston.format.simple(),
    })
  );
} else {
  // Add Logtail transport for all other environments.
  if (logtail) {
    transports.push(new LogtailTransport(logtail));
  }
}

// Create the logger instance.
const logger = winston.createLogger({
  level: config.logLevel,
  levels: levels,
  format: format,
  transports: transports,
  exceptionHandlers: exceptionTransports,
  rejectionHandlers: rejectionTransports,
  exitOnError: false,
});

export default logger;
export { logtail };
