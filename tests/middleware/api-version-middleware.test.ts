import { describe, expect, test, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { apiVersionMiddleware } from '../../src/middleware/api-version-middleware';

describe('API Versioning Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      setHeader: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  test('should detect v1 API version from path', () => {
    mockRequest.path = '/api/v1/test';
    mockRequest.headers = {};
    mockRequest.query = {};

    apiVersionMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-API-Version', 'v1');
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-API-Deprecation-Warning',
      'API v1 is deprecated. Please migrate to v2 by 2025-12-31.'
    );
    expect(nextFunction).toHaveBeenCalled();
  });

  test('should detect v2 API version from path', () => {
    mockRequest.path = '/api/v2/test';
    mockRequest.headers = {};
    mockRequest.query = {};

    apiVersionMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-API-Version', 'v2');
    expect(mockResponse.setHeader).not.toHaveBeenCalledWith(
      'X-API-Deprecation-Warning',
      expect.any(String)
    );
    expect(nextFunction).toHaveBeenCalled();
  });

  test('should detect version from header', () => {
    mockRequest.path = '/test';
    mockRequest.headers = { 'api-version': 'v2' };
    mockRequest.query = {};

    apiVersionMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-API-Version', 'v2');
    expect(nextFunction).toHaveBeenCalled();
  });

  test('should default to v1 when no version specified', () => {
    mockRequest.path = '/test';
    mockRequest.headers = {};
    mockRequest.query = {};

    apiVersionMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-API-Version', 'v1');
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-API-Deprecation-Warning',
      'API v1 is deprecated. Please migrate to v2 by 2025-12-31.'
    );
    expect(nextFunction).toHaveBeenCalled();
  });
});