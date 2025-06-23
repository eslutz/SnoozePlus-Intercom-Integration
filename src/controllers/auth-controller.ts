import { RequestHandler } from 'express';
import passport from 'passport';
import { asyncHandler, AppError } from '../middleware/error-middleware.js';

// Define the authenticate function type
type AuthenticateFunction = (
  strategy: string,
  options?: Record<string, unknown>
) => RequestHandler;

const callback: RequestHandler = (req, res, next) => {
  void (passport.authenticate as AuthenticateFunction)('intercom', {
    successRedirect: req.query.state
      ? decodeURIComponent(req.query.state as string)
      : '/initialize',
    failureRedirect: '/auth/failure',
  })(req, res, next);
};

const failure: RequestHandler = (_req, res) => {
  res.status(401).send('Failed to authenticate.');
};

const login: RequestHandler = (req, res, next) => {
  const state = req.query.state ?? req.session.lastUrl ?? '/';
  void (passport.authenticate as AuthenticateFunction)('intercom', {
    state: encodeURIComponent(state as string),
  })(req, res, next);
};

const logout: RequestHandler = asyncHandler(async (req, res) => {
  await new Promise<void>((resolve, reject) => {
    req.logout((err: Error | null) => {
      if (err) {
        reject(new AppError('Logout failed', 500));
      } else {
        resolve();
      }
    });
  });

  await new Promise<void>((resolve, reject) => {
    req.session.destroy((err: Error | null) => {
      if (err) {
        reject(new AppError('Session destruction failed', 500));
      } else {
        resolve();
      }
    });
  });

  res.status(200).send('Logout successful');
});

export { callback, failure, login, logout };
