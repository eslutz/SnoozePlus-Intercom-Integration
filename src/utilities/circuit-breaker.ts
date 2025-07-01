/**
 * Circuit breaker states for managing external service failures
 */
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Configuration options for the circuit breaker
 */
export interface CircuitBreakerOptions {
  /** Number of failures before opening the circuit */
  failureThreshold: number;
  /** Timeout for individual operations in milliseconds */
  timeout: number;
  /** Time to wait before transitioning from OPEN to HALF_OPEN in milliseconds */
  resetTimeout: number;
  /** Period for monitoring circuit health in milliseconds */
  monitoringPeriod: number;
}

/**
 * Circuit breaker implementation for protecting against external service failures.
 *
 * The circuit breaker operates in three states:
 * - CLOSED: Normal operation, calls are allowed through
 * - OPEN: Circuit is open, calls are rejected immediately
 * - HALF_OPEN: Testing if service has recovered, limited calls allowed
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: CircuitState = CircuitState.CLOSED;
  private successCount = 0;

  constructor(private options: CircuitBreakerOptions) {}

  /**
   * Execute a function with circuit breaker protection
   *
   * @param fn Function to execute
   * @returns Promise resolving to the function result
   * @throws Error if circuit is open or function fails
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      if (now - this.lastFailureTime > this.options.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error(
          `Circuit breaker is OPEN. Retry after ${this.options.resetTimeout}ms`
        );
      }
    }

    try {
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Execute function with timeout protection
   *
   * @param fn Function to execute
   * @returns Promise resolving to function result or timeout error
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Circuit breaker timeout')),
          this.options.timeout
        )
      ),
    ]);
  }

  /**
   * Handle successful execution
   */
  private onSuccess() {
    this.failures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) {
        // Require 3 successes to fully close
        this.state = CircuitState.CLOSED;
      }
    } else {
      this.state = CircuitState.CLOSED;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  /**
   * Get current circuit breaker state and metrics
   *
   * @returns Object containing current state and metrics
   */
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      successCount: this.successCount,
    };
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset() {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.successCount = 0;
    this.state = CircuitState.CLOSED;
  }
}
