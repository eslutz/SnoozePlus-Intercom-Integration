// @ts-expect-error: type not yet defined
const fetch = (...args) =>
  // @ts-expect-error: type not yet defined
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
import logger from '../config/logger-config';
import operation from '../config/retry-config';

const heartbeatUrl = process.env.BETTERSTACK_HEARTBEAT_URL ?? '';

const sendHeartbeat = async (success: boolean = true): Promise<void> => {
  const url = success ? heartbeatUrl : `${heartbeatUrl}/fail`;
  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          logger.info('Heartbeat sent successfully.');
        } else {
          logger.error(`Failed to send heartbeat. Status: ${response.status}`);
        }
        resolve();
      } catch (err) {
        logger.error(
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
