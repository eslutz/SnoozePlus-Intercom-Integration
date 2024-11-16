import { RequestHandler } from 'express';

const isLoggedIn: RequestHandler = (req, res, next) => {
  req.session.lastUrl = req.originalUrl;
  req.isAuthenticated() ? next() : res.redirect('/auth/intercom');
};

export { isLoggedIn };
