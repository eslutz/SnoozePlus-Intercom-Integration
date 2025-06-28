import { describe, expect, test } from '@jest/globals';
import { AppError } from '../../src/middleware/error-middleware';

describe('Error Handling', () => {
  describe('AppError class', () => {
    test('should create error with default values', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
    });

    test('should create error with custom values', () => {
      const error = new AppError('Custom error', 404, false);

      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(false);
    });

    test('should capture stack trace', () => {
      const error = new AppError('Stack test');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Stack test');
    });
  });
});
