import fetch from 'node-fetch';
import config from '../config/config.js';
import logger from '../config/logger-config.js';
import createRetryOperation from '../config/retry-config.js';

const heartbeatLogger = logger.child({ module: 'heartbeat-service' });

const baseUrl = config.betterstackHeartbeatUrl;

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
              return null;
            }
            reject(operation.mainError()!);
          });
      } catch (err) {
        heartbeatLogger.error(
          `Error sending heartbeat on attempt ${currentAttempt}: ${String(err)}`
        );
        if (operation.retry(err as Error)) {
          return null;
        }
        reject(operation.mainError()!);
      }
    });
  });
};

export default sendHeartbeat;
