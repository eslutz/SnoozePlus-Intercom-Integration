import morgan from 'morgan';
import winston from 'winston';
import 'winston-daily-rotate-file';

// Set the log level based on environment variable or default options.
const logLevel = () =>
  process.env.LOG_LEVEL ??
  (process.env.NODE_ENV === 'production' ? 'http' : 'debug');

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

// Add file transports for non-production environments.
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '7d',
      format: winston.format.simple(),
    }),
    new winston.transports.DailyRotateFile({
      level: 'error',
      filename: 'logs/error-%DATE%.log',
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
}

const logger = winston.createLogger({
  level: logLevel(),
  levels: levels,
  format: format,
  transports: transports,
  exceptionHandlers: exceptionTransports,
  rejectionHandlers: rejectionTransports,
  exitOnError: false,
});

// Configure Morgan to use the winston logger.
const morganMiddleware = morgan(
  function (tokens, req, res) {
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: Number.parseFloat(tokens.status(req, res) ?? '0'),
      content_length: tokens.res(req, res, 'content-length'),
      response_time: Number.parseFloat(
        tokens['response-time'](req, res) ?? '0'
      ),
    });
  },
  {
    stream: {
      // Configure Morgan to use our custom logger with the http severity0
      write: (message) => {
        const data = JSON.parse(message);
        logger.http(`incoming-request`, data);
      },
    },
  }
);

export default logger;
export { morganMiddleware };
