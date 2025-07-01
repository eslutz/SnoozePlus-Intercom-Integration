import crypto from 'crypto';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pool from './db-config.js';
import config from './config.js';
import logger from './logger-config.js';

const sessionLogger = logger.child({ module: 'session-config' });

const PgSession = connectPgSimple(session);

/**
 * Secure session configuration with PostgreSQL storage
 *
 * Features:
 * - PostgreSQL-backed session storage (persistent across restarts)
 * - Secure cookie settings based on environment
 * - Session rotation and automatic cleanup
 * - Cryptographically secure session IDs
 * - CSRF protection via sameSite cookies
 * - HTTPOnly cookies to prevent XSS
 */
export const sessionConfig: session.SessionOptions = {
  store: new PgSession({
    pool,
    tableName: 'user_sessions',
    ttl: 24 * 60 * 60, // 24 hours in seconds
    disableTouch: false, // Enable session touch to extend TTL
    createTableIfMissing: true, // Auto-create sessions table
    schemaName: 'public', // Use public schema
    pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
    errorLog: (error: Error) => {
      sessionLogger.error('Session store error', {
        error: error.message,
        stack: error.stack,
      });
    },
  }),
  secret: config.sessionSecret,
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't create session for unauthenticated users
  rolling: true, // Reset expiration on every request
  name: 'snoozeplus.sid', // Custom session cookie name
  cookie: {
    secure: config.isProduction, // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    sameSite: config.isProduction ? 'strict' : 'lax', // CSRF protection
  },
  genid: () => {
    // Generate cryptographically secure session IDs
    return crypto.randomBytes(32).toString('hex');
  },
};

// Log session configuration for debugging (without sensitive data)
sessionLogger.info('Session configuration initialized', {
  store: 'PostgreSQL',
  secureCookies: config.isProduction,
  cookieMaxAge: '24 hours',
  rolling: true,
  sameSite: config.isProduction ? 'strict' : 'lax',
});

export default sessionConfig;
