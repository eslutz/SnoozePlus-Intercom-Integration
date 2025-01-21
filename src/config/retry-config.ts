import retry from 'retry';
import config from './config.js';

const createRetryOperation = () => {
  return retry.operation({
    retries: config.retryAttempts,
    factor: config.retryFactor,
    minTimeout: config.retryMinTimeout,
    maxTimeout: config.retryMaxTimeout,
    randomize: config.retryRandomize,
  });
};

export default createRetryOperation;
