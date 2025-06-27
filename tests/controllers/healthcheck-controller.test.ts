import { describe, expect, test } from '@jest/globals';
import { AppError, asyncHandler } from '../../src/middleware/error-middleware';

describe('Error Handling Patterns', () => {
  test('AppError should create error with status code', () => {
    const error = new AppError('Test error', 400);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });

  test('asyncHandler should catch async errors', async () => {
    const mockNext = jest.fn();
    // Make sure this handler returns a Promise to match the type definition
    const errorHandler = asyncHandler(async (_req, _res, _next) => {
      // Use explicit Promise.reject to ensure async error flow
      return Promise.reject(new AppError('Async error', 500));
    });

    errorHandler({} as any, {} as any, mockNext);

    // Wait for all promises in the event loop to complete
    await new Promise((resolve) => process.nextTick(resolve));

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    const calls = mockNext.mock.calls;
    expect(calls[0]?.[0]?.message).toBe('Async error');
  });

  test('asyncHandler should not interfere with successful execution', async () => {
    const mockReq = {} as any;
    const mockRes = {
      send: jest.fn(),
    } as any;
    const mockNext = jest.fn();

    // Make sure this handler returns a Promise to match the type definition
    const handler = asyncHandler(async (_req, res) => {
      res.send('success');
    });

    handler(mockReq, mockRes, mockNext);

    // Wait for all promises in the event loop to complete
    await new Promise((resolve) => process.nextTick(resolve));

    expect(mockRes.send).toHaveBeenCalledWith('success');
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('error handling middleware patterns work correctly', () => {
    const errors = [
      new AppError('Not Found', 404),
      new AppError('Unauthorized', 401),
      new AppError('Internal Server Error', 500),
    ];

    errors.forEach((error) => {
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(typeof error.statusCode).toBe('number');
      expect(typeof error.isOperational).toBe('boolean');
    });
  });
});
