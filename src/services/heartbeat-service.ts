import fetch from 'node-fetch';
import config from '../config/config.js';
import logger from '../config/logger-config.js';
import createRetryOperation from '../config/retry-config.js';

const heartbeatLogger = logger.child({ module: 'heartbeat-service' });

const baseUrl = config.betterstackHeartbeatUrl;

/**
 * Sends a heartbeat signal to a monitoring endpoint with retry functionality.
 *
 * @function sendHeartbeat
 * @param success Determines which endpoint URL to use: If true, uses base URL; if false, appends '/fail' to base URL
 * @returns {Promise<void>} Resolves when heartbeat is successfully sent or max retries are exhausted
 * @throws {Error} If all retry attempts fail to send the heartbeat
 */
const sendHeartbeat = (success = true): Promise<void> => {
  const url = success ? baseUrl : `${baseUrl}/fail`;

  return new Promise((resolve, reject) => {
    const operation = createRetryOperation();
    operation.attempt((currentAttempt) => {
      try {
        fetch(url, { method: 'HEAD' })
          .then((response) => {
            if (response.ok) {
              heartbeatLogger.info('Heartbeat sent successfully.');
            } else {
              heartbeatLogger.error(
                `Failed to send heartbeat. Status: ${response.status}`
              );
            }
            resolve();
          })
          .catch((err: Error) => {
            heartbeatLogger.error(
              `Error sending heartbeat on attempt ${currentAttempt}: ${err.message}`
            );
            if (operation.retry(err)) {
              return;
            }
            reject(operation.mainError()!);
          });
      } catch (err) {
        heartbeatLogger.error(
          `Error sending heartbeat on attempt ${currentAttempt}: ${String(err)}`
        );
        if (operation.retry(err as Error)) {
          return;
        }
        reject(operation.mainError()!);
      }
    });
  });
};

export default sendHeartbeat;
