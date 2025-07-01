/**
 * Middleware for API versioning and deprecation warnings.
 *
 * @module middleware/api-version-middleware
 * @exports apiVersionMiddleware - API version handling middleware
 */
import { Request, Response, NextFunction } from 'express';

export const apiVersionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const version = getApiVersion(req);

  // Add version information to response headers
  res.setHeader('X-API-Version', version);

  // Add deprecation warnings for old versions
  if (version === 'v1') {
    res.setHeader(
      'X-API-Deprecation-Warning',
      'API v1 is deprecated. Please migrate to v2 by 2025-12-31.'
    );
    res.setHeader('X-API-Deprecation-Date', '2025-12-31');
    res.setHeader(
      'X-API-Migration-Guide',
      'https://docs.snoozeplus.app/migration/v1-to-v2'
    );
  }

  next();
};

function getApiVersion(req: Request): string {
  const pathVersion = (/^\/api\/v(\d+)\//.exec(req.path))?.[1];
  const headerVersion = req.headers['api-version'] as string;
  const queryVersion = req.query.version as string;

  return pathVersion ?? headerVersion ?? queryVersion ?? 'v1';
}
