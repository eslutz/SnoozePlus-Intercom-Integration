import fetch from 'node-fetch';
import config from '../config/config.js';
import logger from '../config/logger-config.js';
import operation from '../config/retry-config.js';

const heartbeatLogger = logger.child({ module: 'heartbeat-service' });

const baseUrl = config.betterstackHeartbeatUrl;

const sendHeartbeat = async (success = true): Promise<void> => {
  const url = success ? baseUrl : `${baseUrl}/fail`;

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          heartbeatLogger.info('Heartbeat sent successfully.');
        } else {
          heartbeatLogger.error(`Failed to send heartbeat. Status: ${response.status}`);
        }
        resolve();
      } catch (err) {
        heartbeatLogger.error(
          `Error sending heartbeat on attempt ${currentAttempt}: ${err}`
        );
        if (operation.retry(err as Error)) {
          return;
        }
        reject(operation.mainError());
      }
    });
  });
};

export default sendHeartbeat;
