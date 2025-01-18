import logger from '../config/logger-config';
import type { RequestInfo, RequestInit, Response } from 'node-fetch';

const fetchLogger = logger.child({ module: 'fetch-instance' });

// Define the fetch type.
type FetchType = (url: RequestInfo, init?: RequestInit) => Promise<Response>;

// Initialize fetch instance.
let fetchInstance: FetchType | null = null;

/**
 * Dynamically imports and returns the fetch function from node-fetch.
 * Ensures that fetch is imported only once.
 */
const getFetch = async (): Promise<FetchType> => {
  if (!fetchInstance) {
    try {
      const { default: nodeFetch } = await import('node-fetch');
      fetchInstance = nodeFetch;
      fetchLogger.debug('Successfully imported node-fetch.');
    } catch (err) {
      fetchLogger.error(`Error importing node-fetch: ${String(err)}`);
      throw err;
    }
  }
  return fetchInstance;
};

export { getFetch };
