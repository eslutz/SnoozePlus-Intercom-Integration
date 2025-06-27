import { Request, Response, NextFunction } from 'express';
import config from '../config/config.js';
import logger from '../config/logger-config.js';
import { AppError } from './error-middleware.js';

const validateIpLogger = logger.child({
  module: 'validate-ip-middleware',
});

const allowedIps = config.ipAllowlist.split(',');

const validateIp = (req: Request, _res: Response, next: NextFunction): void => {
  const requestIp = req.ip ?? '';

  if (!allowedIps.includes(requestIp)) {
    validateIpLogger.warn(`IP ${requestIp} is not allowed`);
    return next(new AppError('Forbidden: IP not allowed', 403));
  }

  validateIpLogger.debug(`IP ${requestIp} is allowed`);
  next();
};

export default validateIp;
