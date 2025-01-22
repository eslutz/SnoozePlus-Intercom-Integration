/**
 * Database configuration module utilizing a PostgreSQL connection
 * pool using the 'pg' library.
 *
 * @module db-config
 * @exports pool A PostgreSQL connection pool instance
 * @remarks Creates a new pool instance using default environment
 * variables to manage database connections efficiently:
 *  - PGUSER for username
 *  - PGHOST for host
 *  - PGPASSWORD for password
 *  - PGDATABASE for database name
 *  - PGPORT for port number
 */
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool();

export default pool;
