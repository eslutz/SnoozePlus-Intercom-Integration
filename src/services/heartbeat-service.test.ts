import sendHeartbeat from './heartbeat-service';
import logger from '../config/logger-config';
import operation from '../config/retry-config';
const fetch = require('node-fetch');

// Mock dependencies
jest.mock('node-fetch', () => jest.fn());
jest.mock('../config/logger-config', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));
jest.mock('../config/retry-config', () => ({
  attempt: jest.fn((fn) => fn(1)),
  retry: jest.fn(() => false),
}));

describe('sendHeartbeat', () => {
  const heartbeatUrl = 'https://test.fakeurl.com/heartbeat';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send a successful heartbeat', async () => {
    fetch.mockResolvedValue({ ok: true });

    await sendHeartbeat(true);

    expect(fetch).toHaveBeenCalledWith(heartbeatUrl, { method: 'HEAD' });
    expect(logger.info).toHaveBeenCalledWith('Heartbeat sent successfully.');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should send a failed heartbeat', async () => {
    fetch.mockResolvedValue({ ok: true });

    await sendHeartbeat(false);

    expect(fetch).toHaveBeenCalledWith(`${heartbeatUrl}/fail`, {
      method: 'HEAD',
    });
    expect(logger.info).toHaveBeenCalledWith('Heartbeat sent successfully.');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should log an error if the heartbeat fails', async () => {
    fetch.mockResolvedValue({ ok: false, status: 500 });

    await sendHeartbeat(true);

    expect(fetch).toHaveBeenCalledWith(heartbeatUrl, { method: 'HEAD' });
    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to send heartbeat. Status: 500'
    );
  });
});
