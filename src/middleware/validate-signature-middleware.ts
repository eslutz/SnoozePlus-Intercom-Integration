import { RequestHandler } from 'express';
import logger from '../config/logger-config';
import { signatureValidator } from '../utilities/crypto-utility';

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

  // Check if the signature is valid.
  const signatureValid = signatureValidator(req.body, signature);
  if (!signatureValid) {
    validateSignatureLogger.error('Invalid signature');
    res.status(401).send('Invalid signature');
    return;
  }

  validateSignatureLogger.debug('Signature validated');
  next();
};

export default validateSignature;
