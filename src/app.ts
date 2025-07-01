import config from './config/config.js';
import express from 'express';
import { Server } from 'http';
import session from 'express-session';
import passport from 'passport';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger-config.js';
import logger, { closeLogger } from './config/logger-config.js';
import { closePool } from './config/db-config.js';
import { morganMiddleware } from './middleware/logger-middleware.js';
import {
  globalErrorHandler,
  notFoundHandler,
  unhandledRejectionHandler,
  uncaughtExceptionHandler,
} from './middleware/error-middleware.js';
import { handleValidationError } from './middleware/validation-middleware.js';
import { metricsMiddleware } from './middleware/metrics-middleware.js';
import { correlationMiddleware } from './middleware/correlation-middleware.js';
import { apiVersionMiddleware } from './middleware/api-version-middleware.js';
import { enhancedErrorHandler } from './middleware/enhanced-error-middleware.js';
import {
  securityHeaders,
  additionalSecurityHeaders,
} from './middleware/security-headers.js';
import { rateLimitConfigs } from './middleware/advanced-rate-limiting.js';
import { requestSizeLimits } from './middleware/request-size-limiting.js';
import router from './routes/router.js';
import scheduleJobs, {
  messageScheduler,
} from './utilities/scheduler-utility.js';
import './config/auth-config.js';

const app = express();

// Define __filename and __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Enhanced security middleware
app.use(securityHeaders);
app.use(additionalSecurityHeaders);

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

// General rate limiting - will be overridden by specific endpoint limits
app.use(rateLimitConfigs.general);

// Compression middleware
app.use(compression());

// Request parsing middleware with enhanced size limits
app.use(morganMiddleware);
app.use(requestSizeLimits.general);
app.use(express.json({ limit: '1mb' })); // Reduced from 10mb for better security
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Static file serving
app.use(express.static('public'));
app.use(express.static(path.join(__dirname)));

// Configure session and add passport.
import sessionConfig from './config/session-config.js';
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// Monitoring and observability middleware
app.use(correlationMiddleware);
app.use(metricsMiddleware);
app.use(apiVersionMiddleware);

// Request ID middleware for tracking (enhanced with correlation)
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

// Error handling middleware (order matters - enhanced error handler should be last)
app.use(handleValidationError);
app.use(notFoundHandler);
app.use(enhancedErrorHandler);
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

/**
 * Enhanced graceful shutdown handler for the HTTP server.
 * Handles cleanup of resources in the correct order to prevent data loss.
 *
 * @param server - The HTTP server instance to shutdown
 * @returns Function that handles the actual shutdown process
 */
const enhancedGracefulShutdown = (server: Server) => async (signal: string) => {
  appLogger.info(`Received ${signal}, starting graceful shutdown...`);

  try {
    // Stop accepting new connections
    server.close(() => {
      appLogger.info('HTTP server closed');
    });

    // Shutdown services in order
    await messageScheduler.shutdown();
    await closePool();
    await closeLogger();

    appLogger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    appLogger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', (signal) => {
  void enhancedGracefulShutdown(server)(signal);
});
process.on('SIGINT', (signal) => {
  void enhancedGracefulShutdown(server)(signal);
});
