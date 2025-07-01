import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';

// Mock dependencies
jest.mock('../../src/config/config.js', () => ({
  default: {
    isProduction: false,
  },
}));

jest.mock('../../src/services/heartbeat-service.js', () => ({
  default: jest.fn(),
}));

jest.mock('../../src/services/schedule-message-service.js', () => ({
  default: jest.fn(),
}));

// Mock node-schedule
const mockJob = {
  cancel: jest.fn(),
  nextInvocation: jest.fn(() => new Date()),
};

const mockScheduleJob = jest.fn(() => mockJob);
const mockGracefulShutdown = jest.fn();

jest.mock('node-schedule', () => ({
  scheduleJob: mockScheduleJob,
  gracefulShutdown: mockGracefulShutdown,
}));

describe('MessageScheduler', () => {
  let MessageScheduler: any;
  let scheduler: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    // Dynamic import to get fresh instance
    const module = await import('../../src/utilities/scheduler-utility.js');
    MessageScheduler = module.MessageScheduler;
    scheduler = new MessageScheduler();
  });

  afterEach(() => {
    jest.useRealTimers();
    if (scheduler) {
      scheduler.cleanupInterval && clearInterval(scheduler.cleanupInterval);
    }
  });

  test('should create scheduler with cleanup interval', () => {
    expect(scheduler).toBeDefined();
    expect(scheduler.getActiveJobCount()).toBe(0);
  });

  test('should schedule a message successfully', async () => {
    const messageId = 'test-message-1';
    const sendDate = new Date(Date.now() + 3600000); // 1 hour from now
    const callback = jest.fn();

    await scheduler.scheduleMessage(messageId, sendDate, callback);

    expect(mockScheduleJob).toHaveBeenCalledWith(
      messageId,
      sendDate,
      expect.any(Function)
    );
    expect(scheduler.getActiveJobCount()).toBe(1);
  });

  test('should cancel existing job when scheduling new one with same ID', async () => {
    const messageId = 'test-message-1';
    const sendDate = new Date(Date.now() + 3600000);
    const callback = jest.fn();

    // Schedule first job
    await scheduler.scheduleMessage(messageId, sendDate, callback);
    
    // Schedule second job with same ID
    await scheduler.scheduleMessage(messageId, sendDate, callback);

    expect(mockJob.cancel).toHaveBeenCalled();
    expect(scheduler.getActiveJobCount()).toBe(1);
  });

  test('should cancel job successfully', async () => {
    const messageId = 'test-message-1';
    const sendDate = new Date(Date.now() + 3600000);
    const callback = jest.fn();

    await scheduler.scheduleMessage(messageId, sendDate, callback);
    const cancelled = scheduler.cancelJob(messageId);

    expect(cancelled).toBe(true);
    expect(mockJob.cancel).toHaveBeenCalled();
    expect(scheduler.getActiveJobCount()).toBe(0);
  });

  test('should return false when cancelling non-existent job', () => {
    const cancelled = scheduler.cancelJob('non-existent');
    expect(cancelled).toBe(false);
  });

  test('should get job info correctly', async () => {
    const messageId = 'test-message-1';
    const sendDate = new Date(Date.now() + 3600000);
    const callback = jest.fn();
    const nextInvocation = new Date();

    mockJob.nextInvocation.mockReturnValue(nextInvocation);

    await scheduler.scheduleMessage(messageId, sendDate, callback);
    const jobInfo = scheduler.getJobInfo(messageId);

    expect(jobInfo).toEqual({
      nextInvocation: nextInvocation,
    });
  });

  test('should return null for non-existent job info', () => {
    const jobInfo = scheduler.getJobInfo('non-existent');
    expect(jobInfo).toBeNull();
  });

  test('should cleanup completed jobs', async () => {
    const messageId = 'test-message-1';
    const sendDate = new Date(Date.now() + 3600000);
    const callback = jest.fn();

    // Mock job as completed (no next invocation)
    mockJob.nextInvocation.mockReturnValue(null);

    await scheduler.scheduleMessage(messageId, sendDate, callback);
    expect(scheduler.getActiveJobCount()).toBe(1);

    // Trigger cleanup
    jest.advanceTimersByTime(60000); // 1 minute

    expect(scheduler.getActiveJobCount()).toBe(0);
    expect(mockJob.cancel).toHaveBeenCalled();
  });

  test('should clean up jobs scheduled more than 24 hours ahead after timeout', async () => {
    const messageId = 'test-long-scheduled-job';
    const sendDate = new Date(Date.now() + 30 * 60 * 60 * 1000); // 30 hours from now
    const callback = jest.fn();

    // Mock the job as active (has next invocation)
    mockJob.nextInvocation.mockReturnValue(sendDate);

    await scheduler.scheduleMessage(messageId, sendDate, callback);
    expect(scheduler.getActiveJobCount()).toBe(1);

    // Fast-forward 24 hours to trigger the cleanup timeout
    jest.advanceTimersByTime(24 * 60 * 60 * 1000);

    // The job should be cancelled after the 24-hour timeout
    expect(mockJob.cancel).toHaveBeenCalled();
    expect(scheduler.getActiveJobCount()).toBe(0);
  });

  test('should shutdown gracefully', async () => {
    const messageId = 'test-message-1';
    const sendDate = new Date(Date.now() + 3600000);
    const callback = jest.fn();

    await scheduler.scheduleMessage(messageId, sendDate, callback);
    
    const shutdownPromise = scheduler.shutdown();
    
    // Allow promises to resolve
    await Promise.resolve();
    await shutdownPromise;

    expect(mockJob.cancel).toHaveBeenCalled();
    expect(mockGracefulShutdown).toHaveBeenCalled();
    expect(scheduler.getActiveJobCount()).toBe(0);
  });

  test('should reject scheduling when shutting down', async () => {
    const messageId = 'test-message-1';
    const sendDate = new Date(Date.now() + 3600000);
    const callback = jest.fn();

    // Start shutdown
    const shutdownPromise = scheduler.shutdown();
    
    // Try to schedule
    await expect(scheduler.scheduleMessage(messageId, sendDate, callback))
      .rejects.toThrow('Scheduler is shutting down');
      
    await shutdownPromise;
  });
});