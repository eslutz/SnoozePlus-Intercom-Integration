import { RequestHandler } from 'express';
import logger from '../config/logger-config';

const validateIpLogger = logger.child({
  module: 'validate-ip-middleware',
});

const allowedIps = process.env.ALLOWED_IPS?.split(',');
if (!allowedIps) {
  throw new Error('IP_ALLOWLIST cannot be found!');
}

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
