import { describe, expect, test, jest, beforeEach } from '@jest/globals';

describe('Database Configuration', () => {
  let getPoolMetrics: any;
  let checkDatabaseHealth: any;
  let closePool: any;
  
  // Mock dependencies
  const mockQuery = jest.fn();
  const mockEnd = jest.fn();
  const mockPool = {
    query: mockQuery,
    end: mockEnd,
    totalCount: 5,
    idleCount: 3,
    waitingCount: 0,
    on: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Reset modules to get fresh imports
    jest.resetModules();
    
    // Mock pg module
    jest.doMock('pg', () => ({
      Pool: jest.fn(() => mockPool),
    }));
    
    // Import after mocking
    const module = await import('../../src/config/db-config.js');
    getPoolMetrics = module.getPoolMetrics;
    checkDatabaseHealth = module.checkDatabaseHealth;
    closePool = module.closePool;
  });

  test('getPoolMetrics should return pool statistics', () => {
    const metrics = getPoolMetrics();
    
    expect(metrics).toEqual({
      totalCount: 5,
      idleCount: 3,
      waitingCount: 0,
    });
  });

  test('checkDatabaseHealth should return true for successful connection', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ result: 1 }] });
    
    const isHealthy = await checkDatabaseHealth();
    
    expect(isHealthy).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith('SELECT 1');
  });

  test('checkDatabaseHealth should retry on failure and return false after max retries', async () => {
    mockQuery.mockRejectedValue(new Error('Connection failed'));
    
    const isHealthy = await checkDatabaseHealth();
    
    expect(isHealthy).toBe(false);
    expect(mockQuery).toHaveBeenCalledTimes(3); // Should retry 3 times
  });

  test('closePool should end the database pool', async () => {
    await closePool();
    
    expect(mockEnd).toHaveBeenCalled();
  });
});