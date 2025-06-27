import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger-config.js';
import SignatureAlgorithm from '../enums/signature-algorithm-enum.js';
import { signatureValidator } from '../utilities/crypto-utility.js';
import { AppError } from './error-middleware.js';

const validateCanvasSignatureLogger = logger.child({
  module: 'validate-signature-canvas-middleware',
});

const validateSignature = (req: Request, _res: Response, next: NextFunction): void => {
  // Retrieve the signature from the headers.
  const signature = req.headers['x-body-signature'] as string;
  if (!signature) {
    validateCanvasSignatureLogger.error('Missing X-Body-Signature header');
    return next(new AppError('Missing X-Body-Signature header', 400));
  }

  // Check if the signature is valid.
  const signatureValid = signatureValidator(
    JSON.stringify(req.body),
    signature,
    SignatureAlgorithm.CANVAS
  );
  if (!signatureValid) {
    validateCanvasSignatureLogger.error('Invalid signature');
    return next(new AppError('Invalid signature', 401));
  }

  validateCanvasSignatureLogger.debug('Signature validated');
  next();
};

export default validateSignature;
