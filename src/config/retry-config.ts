/**
 * Retry configuration module.
 *
 * @module retry-config
 * @exports createRetryOperation A function that creates a retry operation
 */
import retry from 'retry';
import config from './config.js';

/**
 * Creates a retry operation with configured parameters for handling retries in case of failures.
 *
 * @function createRetryOperation
 * @returns {retry.RetryOperation} A configured retry operation instance that can be used to retry failed operations
 * @remarks The retry operation is configured using parameters from the config file:
 *  - retryAttempts: Number of times to retry failed operations
 *  - retryFactor: Exponential backoff multiplier between retries
 *  - retryMinTimeout: Minimum wait time in ms between retries
 *  - retryMaxTimeout: Maximum wait time in ms between retries
 *  - retryRandomize: Whether to add randomization to retry delays
 */
const createRetryOperation = (): retry.RetryOperation => {
  return retry.operation({
    retries: config.retryAttempts,
    factor: config.retryFactor,
    minTimeout: config.retryMinTimeout,
    maxTimeout: config.retryMaxTimeout,
    randomize: config.retryRandomize,
  });
};

export default createRetryOperation;
