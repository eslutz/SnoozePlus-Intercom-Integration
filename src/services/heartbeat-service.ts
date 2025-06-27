import fetch from 'node-fetch';
import config from '../config/config.js';
import logger from '../config/logger-config.js';
import { retryAsyncOperation } from '../utilities/retry-utility.js';

const heartbeatLogger = logger.child({ module: 'heartbeat-service' });

const baseUrl = config.betterstackHeartbeatUrl;

/**
 * Sends a heartbeat signal to a monitoring endpoint with retry functionality.
 *
 * @function sendHeartbeat
 * @param {boolean} [success=true] - Determines which endpoint URL to use: If true, uses base URL; if false, appends '/fail' to base URL
 * @returns {Promise<void>} Resolves when heartbeat is successfully sent or max retries are exhausted
 * @throws {Error} If all retry attempts fail to send the heartbeat
 */
const sendHeartbeat = (success = true): Promise<void> => {
  const url = success ? baseUrl : `${baseUrl}/fail`;

  return retryAsyncOperation<void>(async () => {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error(`Heartbeat failed with status ${response.status}`);
    }
    heartbeatLogger.info('Heartbeat sent successfully.');
  }, 'sendHeartbeat');
};

export default sendHeartbeat;
