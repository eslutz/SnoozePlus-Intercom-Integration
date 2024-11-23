import { RequestHandler } from 'express';
import passport from 'passport';

const callback: RequestHandler = (req, res, next) => {
  passport.authenticate('intercom', {
    successRedirect: req.query.state
      ? decodeURIComponent(req.query.state as string)
      : '/initialize',
    failureRedirect: '/auth/failure',
  })(req, res, next);
};

const failure: RequestHandler = (req, res) => {
  res.status(401).send('Failed to authenticate.');
};

const login: RequestHandler = (req, res, next) => {
  const state = req.query.state || req.session.lastUrl || '/';
  passport.authenticate('intercom', {
    state: encodeURIComponent(state as string),
  })(req, res, next);
};

const logout: RequestHandler = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.status(200).send('Logout successful');
    });
  });
};

export { callback, failure, login, logout };
