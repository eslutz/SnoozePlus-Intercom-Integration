/**
 * Middleware for API versioning.
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

  next();
};

function getApiVersion(req: Request): string {
  const pathVersion = /^\/api\/v(\d+)\//.exec(req.path)?.[1];
  const headerVersion = req.headers['api-version'] as string;
  const queryVersion = req.query.version as string;

  const version = pathVersion ?? headerVersion ?? queryVersion ?? '1';
  return version.startsWith('v') ? version : `v${version}`;
}
