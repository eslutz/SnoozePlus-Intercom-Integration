import { RequestHandler, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { asyncHandler, AppError } from '../middleware/error-middleware.js';

// Define the authenticate function type
type AuthenticateFunction = (
  strategy: string,
  options?: Record<string, unknown>
) => RequestHandler;

const callback: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  void (passport.authenticate as AuthenticateFunction)('intercom', {
    successRedirect: req.query.state
      ? decodeURIComponent(req.query.state as string)
      : '/initialize',
    failureRedirect: '/auth/failure',
  })(req, res, next);
};

const failure: RequestHandler = (_req: Request, res: Response): void => {
  res.status(401).send('Failed to authenticate.');
};

const login: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // req.session.lastUrl is added by express-session but TypeScript doesn't know about it
  // See the express-session.d.ts declaration file for the extended SessionData interface
  const state = req.query.state ?? req.session.lastUrl ?? '/';
  void (passport.authenticate as AuthenticateFunction)('intercom', {
    state: encodeURIComponent(state as string),
  })(req, res, next);
};

const logout: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await new Promise<void>(
      (resolve: () => void, reject: (reason: Error) => void) => {
        // req.logout is added by passport.js but TypeScript doesn't know about it
        // See the authenticated-request.d.ts declaration file for the extended type
        req.logout((err: Error | null) => {
          if (err) {
            reject(new AppError('Logout failed', 500));
          } else {
            resolve();
          }
        });
      }
    );

    await new Promise<void>(
      (resolve: () => void, reject: (reason: Error) => void) => {
        // req.session.destroy is added by express-session but TypeScript doesn't know about it
        // See the authenticated-request.d.ts declaration file for the extended type
        req.session.destroy((err: Error | null) => {
          if (err) {
            reject(new AppError('Session destruction failed', 500));
          } else {
            resolve();
          }
        });
      }
    );

    res.status(200).send('Logout successful');
  }
);

export { callback, failure, login, logout };
