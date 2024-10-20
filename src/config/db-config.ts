import { Pool, QueryArrayResult } from 'pg';

const pool = new Pool();

// TODO: probably add retry logic here or when function is called
const query = (text: any, params: any): Promise<QueryArrayResult<any[]>> =>
  pool.query(text, params);

export { pool, query };
