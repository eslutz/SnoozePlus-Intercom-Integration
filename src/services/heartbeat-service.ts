import fetch from 'node-fetch';
import logger from '../config/logger-config';

const heartbeatUrl = process.env.BETTERSTACK_HEARTBEAT_URL ?? '';

const sendHeartbeat = async (success: boolean = true): Promise<void> => {
  const url = success ? heartbeatUrl : `${heartbeatUrl}/fail`;
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      logger.info('Heartbeat sent successfully.');
    } else {
      logger.error(`Failed to send heartbeat. Status: ${response.status}`);
    }
  } catch (error) {
    logger.error(`Error sending heartbeat: ${error}`);
  }
};

export { sendHeartbeat };
