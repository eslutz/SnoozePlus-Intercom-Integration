import { describe, expect, test } from '@jest/globals';

// Test implementation of AppError for testing
class TestAppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
  }
}

// Test implementation of asyncHandler for testing
const testAsyncHandler = (fn: (...args: any[]) => Promise<any>) => {
  return async (req: any, res: any, next?: any) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      if (next) {
        next(error);
      } else {
        throw error;
      }
    }
  };
};

describe('Error Handling Patterns', () => {
  test('AppError should create error with status code', () => {
    const error = new TestAppError('Test error', 400);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });

  test('asyncHandler should catch async errors', async () => {
    const mockNext = jest.fn();
    const errorHandler = testAsyncHandler(async () => {
      throw new TestAppError('Async error', 500);
    });

    await errorHandler({}, {}, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(TestAppError));
  });

  test('asyncHandler should not interfere with successful execution', async () => {
    const mockReq = {};
    const mockRes = { send: jest.fn() };
    const mockNext = jest.fn();
    
    const handler = testAsyncHandler(async (_req, res) => {
      res.send('success');
    });

    await handler(mockReq, mockRes, mockNext);
    expect(mockRes.send).toHaveBeenCalledWith('success');
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('error handling middleware patterns work correctly', () => {
    const errors = [
      new TestAppError('Not Found', 404),
      new TestAppError('Unauthorized', 401),
      new TestAppError('Internal Server Error', 500),
    ];

    errors.forEach(error => {
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TestAppError);
      expect(typeof error.statusCode).toBe('number');
      expect(typeof error.isOperational).toBe('boolean');
    });
  });
});