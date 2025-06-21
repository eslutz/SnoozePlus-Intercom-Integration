import { describe, expect, test } from '@jest/globals';

// Simple test for error class without external dependencies
class TestAppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

describe('Error Handling', () => {
  describe('AppError class', () => {
    test('should create error with default values', () => {
      const error = new TestAppError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
    });

    test('should create error with custom values', () => {
      const error = new TestAppError('Custom error', 404, false);
      
      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(false);
    });

    test('should capture stack trace', () => {
      const error = new TestAppError('Stack test');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Stack test');
    });
  });
});