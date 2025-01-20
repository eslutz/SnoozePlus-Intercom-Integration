import { RequestHandler } from 'express';
import config from '../config/config.js';
import logger from '../config/logger-config.js';

const validateIpLogger = logger.child({
  module: 'validate-ip-middleware',
});

const allowedIps = config.ipAllowlist.split(',');

const validateIp: RequestHandler = (req, res, next) => {
  const requestIp = req.ip ?? '';

  if (!allowedIps.includes(requestIp)) {
    validateIpLogger.warn(`IP ${requestIp} is not allowed`);
    res.status(403).send('Forbidden');
    return;
  }

  validateIpLogger.debug(`IP ${requestIp} is allowed`);
  next();
};

export default validateIp;
