import { CircuitBreaker, CircuitState } from '../../src/utilities/circuit-breaker.js';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      timeout: 1000,
      resetTimeout: 2000,
      monitoringPeriod: 500,
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Circuit States', () => {
    test('should start in CLOSED state', () => {
      const state = circuitBreaker.getState();
      expect(state.state).toBe(CircuitState.CLOSED);
      expect(state.failures).toBe(0);
    });

    test('should open circuit after failure threshold is reached', async () => {
      const failingFunction = jest.fn().mockRejectedValue(new Error('Service down'));

      // Trigger failures to reach threshold
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFunction);
        } catch (error) {
          // Expected failures
        }
      }

      const state = circuitBreaker.getState();
      expect(state.state).toBe(CircuitState.OPEN);
      expect(state.failures).toBe(3);
    });

    test('should reject calls immediately when circuit is OPEN', async () => {
      const failingFunction = jest.fn().mockRejectedValue(new Error('Service down'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFunction);
        } catch (error) {
          // Expected failures
        }
      }

      // Next call should be rejected immediately
      await expect(circuitBreaker.execute(failingFunction)).rejects.toThrow(
        'Circuit breaker is OPEN'
      );

      // Function should not have been called (still at 3 calls)
      expect(failingFunction).toHaveBeenCalledTimes(3);
    });

    test('should transition to HALF_OPEN after reset timeout', async () => {
      const failingFunction = jest.fn().mockRejectedValue(new Error('Service down'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFunction);
        } catch (error) {
          // Expected failures
        }
      }

      expect(circuitBreaker.getState().state).toBe(CircuitState.OPEN);

      // Advance time past reset timeout
      jest.advanceTimersByTime(2500);

      // Next call should transition to HALF_OPEN
      const successFunction = jest.fn().mockResolvedValue('success');
      await circuitBreaker.execute(successFunction);

      const state = circuitBreaker.getState();
      expect(state.state).toBe(CircuitState.HALF_OPEN);
    });

    test('should close circuit after successful calls in HALF_OPEN state', async () => {
      const failingFunction = jest.fn().mockRejectedValue(new Error('Service down'));
      const successFunction = jest.fn().mockResolvedValue('success');

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFunction);
        } catch (error) {
          // Expected failures
        }
      }

      // Advance time past reset timeout
      jest.advanceTimersByTime(2500);

      // Make 3 successful calls to close the circuit
      for (let i = 0; i < 3; i++) {
        await circuitBreaker.execute(successFunction);
      }

      const state = circuitBreaker.getState();
      expect(state.state).toBe(CircuitState.CLOSED);
      expect(state.failures).toBe(0);
    });

    test('should handle timeout protection', async () => {
      const slowFunction = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 2000))
      );

      // Advance timers to trigger timeout
      const promise = circuitBreaker.execute(slowFunction);
      jest.advanceTimersByTime(1500); // Advance past timeout

      await expect(promise).rejects.toThrow('Circuit breaker timeout');
    }, 15000);

    test('should reset circuit state correctly', async () => {
      const failingFunction = jest.fn().mockRejectedValue(new Error('Service down'));

      // Cause some failures
      await circuitBreaker.execute(failingFunction).catch(() => {});
      await circuitBreaker.execute(failingFunction).catch(() => {});

      expect(circuitBreaker.getState().failures).toBe(2);

      // Reset the circuit
      circuitBreaker.reset();

      const state = circuitBreaker.getState();
      expect(state.state).toBe(CircuitState.CLOSED);
      expect(state.failures).toBe(0);
      expect(state.successCount).toBe(0);
      expect(state.lastFailureTime).toBe(0);
    });
  });

  describe('Success handling', () => {
    test('should reset failure count on successful execution', async () => {
      const failingFunction = jest.fn().mockRejectedValue(new Error('Service down'));
      const successFunction = jest.fn().mockResolvedValue('success');

      // Cause one failure
      try {
        await circuitBreaker.execute(failingFunction);
      } catch (error) {
        // Expected
      }

      expect(circuitBreaker.getState().failures).toBe(1);

      // Execute successful function
      await circuitBreaker.execute(successFunction);

      // Failures should be reset
      expect(circuitBreaker.getState().failures).toBe(0);
      expect(circuitBreaker.getState().state).toBe(CircuitState.CLOSED);
    });
  });
});