import type { RetryOperation } from 'retry';
import createRetryOperation from '../config/retry-config.js';
import logger from '../config/logger-config.js';

const retryLogger = logger.child({ module: 'retry-utility' });

export const retryAsyncOperation = <T>(
  operationFn: () => Promise<T>,
  operationDescription: string
): Promise<T> => {
  const operation: RetryOperation = createRetryOperation();

  return new Promise<T>((resolve, reject) => {
    operation.attempt((currentAttempt: number) => {
      operationFn()
        .then(resolve)
        .catch((err: Error) => {
          retryLogger.error(
            `Error during ${operationDescription} on attempt ${currentAttempt}: ${String(err)}`
          );
          if (operation.retry(err)) {
            retryLogger.warn(
              `Retrying ${operationDescription} due to error: ${err.message}`
            );
            return;
          }
          reject(operation.mainError()!);
        });
    });
  });
};
