import config from './config/config.js';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger-config.js';
import logger from './config/logger-config.js';
import { morganMiddleware } from './middleware/logger-middleware.js';
import {
  globalErrorHandler,
  notFoundHandler,
  gracefulShutdown,
  unhandledRejectionHandler,
  uncaughtExceptionHandler,
} from './middleware/error-middleware.js';
import { handleValidationError } from './middleware/validation-middleware.js';
import router from './routes/router.js';
import scheduleJobs from './utilities/scheduler-utility.js';
import './config/auth-config.js';

const app = express();

// Define __filename and __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Added for Swagger UI
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'], // Added for Swagger UI fonts
      },
    },
    crossOriginEmbedderPolicy: false, // Required for Intercom embedding
  })
);

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? [config.intercomUrl, 'https://app.intercom.io']
        : [
            'http://localhost:3000',
            config.intercomUrl,
            'https://app.intercom.io',
          ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Hub-Signature'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Compression middleware
app.use(compression());

// Request parsing middleware
app.use(morganMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Static file serving
app.use(express.static('public'));
app.use(express.static(path.join(__dirname)));

// Configure session and add passport.
const sessionSecret = config.sessionSecret;
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: 'snoozeplus.sid',
    cookie: {
      secure: config.isProduction,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Request ID middleware for tracking
app.use((req, _res, next) => {
  req.headers['x-request-id'] =
    req.headers['x-request-id'] ??
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  next();
});

// Swagger API documentation (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpecs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'SnoozePlus API Documentation',
    })
  );
}

// Routes
app.use('/', router);

// Error handling middleware
app.use(handleValidationError);
app.use(notFoundHandler);
app.use(globalErrorHandler);

const appLogger = logger.child({ module: 'app' });

// Global error handlers
process.on('unhandledRejection', unhandledRejectionHandler);
process.on('uncaughtException', uncaughtExceptionHandler);

appLogger.info('*** Starting SnoozePlus Intercom Integration ***');

// Start the scheduler for sending messages.
void (async () => {
  try {
    await scheduleJobs();
    appLogger.info('Message scheduler is running.');
  } catch (err) {
    appLogger.error(`Failed to start message scheduler: ${String(err)}`);
    process.exit(1);
  }
})();

const server = app
  .listen(config.port, () => {
    appLogger.info('Express server is running.');
    appLogger.info(`Application is ready at port: ${config.port}`);
  })
  .on('error', (err) => {
    appLogger.error(`Error occurred, server can't start: ${err.message}`);
    appLogger.debug(`Error name: ${err.name}, stack: ${err.stack}`);
  });

// Graceful shutdown handlers
process.on('SIGTERM', (signal) => {
  void gracefulShutdown(server)(signal);
});
process.on('SIGINT', (signal) => {
  void gracefulShutdown(server)(signal);
});
