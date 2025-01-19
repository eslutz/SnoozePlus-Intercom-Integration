import { RequestHandler } from 'express';
import logger from '../config/logger-config.js';
import SignatureHmacAlgorithm from '../enums/signature-hmac-algorithm-enum.js';
import { signatureValidator } from '../utilities/crypto-utility.js';

const validateCanvasSignatureLogger = logger.child({
  module: 'validate-signature-canvas-middleware',
});

const validateSignature: RequestHandler = (req, res, next) => {
  // Retrieve the signature from the headers.
  const signature = req.headers['x-body-signature'] as string;
  if (!signature) {
    validateCanvasSignatureLogger.error('Missing X-Body-Signature header');
    res.status(400).send('Missing X-Body-Signature header');
    return;
  }

  // Check if the signature is valid.
  const signatureValid = signatureValidator(
    req.body,
    signature,
    SignatureHmacAlgorithm.CANVAS
  );
  if (!signatureValid) {
    validateCanvasSignatureLogger.error('Invalid signature');
    res.status(401).send('Invalid signature');
    return;
  }

  validateCanvasSignatureLogger.debug('Signature validated');
  next();
};

export default validateSignature;
