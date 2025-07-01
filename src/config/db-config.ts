/**
 * Secure database configuration module utilizing a PostgreSQL connection
 * pool with security hardening and connection management.
 *
 * @module db-config
 * @exports pool A PostgreSQL connection pool instance with security configuration
 * @remarks Creates a secure pool instance with:
 *  - Connection pooling with min/max limits
 *  - Connection and query timeouts
 *  - SSL configuration for production
 *  - Connection error monitoring
 *  - Statement timeout protection
 */
import pg from 'pg';
import config from './config.js';
import logger from './logger-config.js';

const { Pool } = pg;

const dbLogger = logger.child({ module: 'db-config' });

const poolConfig = {
  host: config.pgHost,
  port: config.pgPort,
  database: config.pgDatabase,
  user: config.pgUser,
  password: config.pgPassword,
  max: 20, // Maximum pool size
  min: 5,  // Minimum pool size
  idleTimeoutMillis: 30000, // 30s idle timeout
  connectionTimeoutMillis: 2000, // 2s connection timeout
  statement_timeout: 30000, // 30s query timeout
  query_timeout: 30000, // 30s query timeout
  application_name: 'snoozeplus-intercom-integration',
  ssl: config.isProduction ? { rejectUnauthorized: true } : false,
};

const pool = new Pool(poolConfig);

// Connection pool monitoring
pool.on('error', (err, client) => {
  dbLogger.error('Unexpected database error on idle client', { 
    error: err.message,
    stack: err.stack,
    client: client ? 'defined' : 'undefined'
  });
});

pool.on('connect', (_client) => {
  dbLogger.debug('New database client connected', {
    connection: 'established'
  });
});

pool.on('acquire', (_client) => {
  dbLogger.debug('Database client acquired from pool');
});

pool.on('remove', (_client) => {
  dbLogger.debug('Database client removed from pool');
});

// Export pool metrics for monitoring
export function getPoolMetrics() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

// Health check with retry logic
export async function checkDatabaseHealth(): Promise<boolean> {
  let retries = 3;
  while (retries > 0) {
    try {
      const result = await pool.query('SELECT 1');
      return result.rows.length > 0;
    } catch (error) {
      retries--;
      if (retries === 0) {
        dbLogger.error('Database health check failed after all retries', { 
          error: error instanceof Error ? error.message : String(error)
        });
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  dbLogger.info('Closing database connection pool...');
  await pool.end();
  dbLogger.info('Database connection pool closed');
}

export default pool;
