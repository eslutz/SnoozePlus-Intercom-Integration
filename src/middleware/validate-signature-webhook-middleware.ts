import { RequestHandler } from 'express';
import logger from '../config/logger-config.js';
import SignatureAlgorithm from '../enums/signature-algorithm-enum.js';
import { signatureValidator } from '../utilities/crypto-utility.js';

const validateWebhookSignatureLogger = logger.child({
  module: 'validate-signature-webhook-middleware',
});

const validateSignature: RequestHandler = (req, res, next) => {
  // Retrieve the signature from the headers.
  const signature = req.headers['x-hub-signature'] as string;
  if (!signature) {
    validateWebhookSignatureLogger.error('Missing X-Hub-Signature header');
    res.status(400).send('Missing X-Hub-Signature header');
    return;
  }

  // Extract the actual signature from the header value.
  const signaturePart = signature.split('sha1=')[1];
  if (!signaturePart) {
    validateWebhookSignatureLogger.error(
      'Invalid X-Hub-Signature header format'
    );
    res.status(400).send('Invalid X-Hub-Signature header format');
    return;
  }

  // Check if the signature is valid.
  const signatureValid = signatureValidator(
    JSON.stringify(req.body),
    signaturePart,
    SignatureAlgorithm.WEBHOOK
  );
  if (!signatureValid) {
    validateWebhookSignatureLogger.error('Invalid signature');
    res.status(401).send('Invalid signature');
    return;
  }

  validateWebhookSignatureLogger.debug('Signature validated');
  next();
};

export default validateSignature;
