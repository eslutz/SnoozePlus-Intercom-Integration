import { RequestHandler } from 'express';
import crypto from 'crypto';
import logger from '../config/logger-config';

const validateSignatureLogger = logger.child({
  module: 'validate-signature-middleware',
});

const validateSignature: RequestHandler = (req, res, next) => {
  // Retrieve the signature from the headers.
  const signature = req.headers['x-body-signature'] as string;
  if (!signature) {
    validateSignatureLogger.error('Missing X-Body-Signature header');
    res.status(400).send('Missing X-Body-Signature header');
    return;
  }

  // Retrieve the client secret.
  const clientSecret = process.env.INTERCOM_CLIENT_SECRET;
  if (!clientSecret) {
    throw new Error('INTERCOM_CLIENT_SECRET cannot be found!');
  }

  // Create a digest from the request body.
  const body = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', clientSecret);
  const digest = hmac.update(body).digest('hex');

  // Compare the digest with the signature.
  if (digest !== signature) {
    validateSignatureLogger.error('Invalid signature');
    res.status(401).send('Invalid signature');
    return;
  }

  validateSignatureLogger.debug('Signature validated');
  next();
};

export default validateSignature;
