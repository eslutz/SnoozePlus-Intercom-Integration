import winston from 'winston';

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
  // Add the message timestamp with the preferred format.
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  // Define message format showing the timestamp, the level and the message
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Set transport option for all environments.
const transports: winston.transport[] = [
  new winston.transports.Console({
    // Add color to the console output.
    format: winston.format.colorize({ all: true }),
  }),
];

// Add file transports for non-production environments.
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.File({
      level: 'error',
      filename: 'logs/error.log',
    }),
    new winston.transports.File({ filename: 'logs/all.log' })
  );
}

const logger = winston.createLogger({
  level: logLevel(),
  levels,
  format,
  transports,
});

export default logger;
