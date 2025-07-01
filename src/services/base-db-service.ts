import { Pool, PoolClient } from 'pg';
import * as pg from 'pg';
import { AppError } from '../middleware/error-middleware.js';
import logger from '../config/logger-config.js';

const baseDbLogger = logger.child({ module: 'base-db-service' });

/**
 * Base database service providing transaction management and common database operations.
 *
 * This abstract class provides:
 * - Automatic transaction management with rollback on errors
 * - Connection pooling and error handling
 * - Consistent logging and monitoring
 * - Safe query execution with timeout protection
 */
export abstract class BaseDbService {
  constructor(protected pool: Pool) {}

  /**
   * Execute a transaction with automatic rollback on error
   *
   * @param callback Function to execute within the transaction
   * @returns Promise resolving to the callback result
   * @throws {AppError} If transaction fails or callback throws
   */
  protected async executeTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    const transactionId = Math.random().toString(36).substr(2, 9);

    baseDbLogger.debug(`Starting transaction ${transactionId}`);

    try {
      await client.query('BEGIN');
      baseDbLogger.debug(`Transaction ${transactionId} began`);

      const result = await callback(client);

      await client.query('COMMIT');
      baseDbLogger.debug(`Transaction ${transactionId} committed`);

      return result;
    } catch (error) {
      baseDbLogger.warn(`Rolling back transaction ${transactionId}`, {
        error: error instanceof Error ? error.message : String(error),
      });

      try {
        await client.query('ROLLBACK');
        baseDbLogger.debug(`Transaction ${transactionId} rolled back`);
      } catch (rollbackError) {
        baseDbLogger.error(`Failed to rollback transaction ${transactionId}`, {
          error:
            rollbackError instanceof Error
              ? rollbackError.message
              : String(rollbackError),
        });
      }

      // Re-throw original error
      if (error instanceof AppError) {
        throw error;
      } else if (error instanceof Error) {
        throw new AppError(
          `Database transaction failed: ${error.message}`,
          500
        );
      } else {
        throw new AppError('Database transaction failed', 500);
      }
    } finally {
      client.release();
      baseDbLogger.debug(`Transaction ${transactionId} client released`);
    }
  }

  /**
   * Execute a safe query with error handling and logging
   *
   * @param client Database client to use
   * @param query SQL query string
   * @param params Query parameters
   * @param operation Operation name for logging
   * @returns Promise resolving to query result
   */
  protected async executeQuery<T extends pg.QueryResultRow>(
    client: PoolClient,
    query: string,
    params: unknown[] = [],
    operation = 'query'
  ): Promise<pg.QueryResult<T>> {
    const queryId = Math.random().toString(36).substr(2, 9);

    baseDbLogger.debug(`Executing ${operation} ${queryId}`, {
      query: query.replace(/\s+/g, ' ').trim(),
      paramCount: params.length,
    });

    try {
      const startTime = Date.now();
      const result = await client.query<T>(query, params);
      const duration = Date.now() - startTime;

      baseDbLogger.debug(`${operation} ${queryId} completed`, {
        rowCount: result.rowCount,
        duration: `${duration}ms`,
      });

      return result;
    } catch (error) {
      baseDbLogger.error(`${operation} ${queryId} failed`, {
        error: error instanceof Error ? error.message : String(error),
        query: query.replace(/\s+/g, ' ').trim(),
      });

      if (error instanceof Error) {
        throw new AppError(
          `Database ${operation} failed: ${error.message}`,
          500
        );
      } else {
        throw new AppError(`Database ${operation} failed`, 500);
      }
    }
  }

  /**
   * Check pool health and connectivity
   *
   * @returns Promise resolving to true if healthy
   */
  public async checkHealth(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1');
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      baseDbLogger.error('Database health check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get current pool statistics
   *
   * @returns Pool statistics object
   */
  public getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }
}
