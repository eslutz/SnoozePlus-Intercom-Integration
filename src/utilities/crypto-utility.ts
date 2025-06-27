import crypto from 'crypto';
import config from '../config/config.js';
import SignatureAlgorithm from '../enums/signature-algorithm-enum.js';
import { AppError } from '../middleware/error-middleware.js';

/**
 * Decrypts an encrypted text using a specified algorithm and key.
 *
 * The encrypted text should be in the format `ivHex:encrypted`, where `ivHex` is the initialization vector
 * in hexadecimal format and `encrypted` is the encrypted data in hexadecimal format.
 *
 * @function decrypt
 * @param encryptedText The encrypted text to decrypt, in the format `ivHex:encrypted`
 * @returns {string} The decrypted text in UTF-8 format
 * @throws {Error} If the encrypted text format is invalid
 */
const decrypt = (encryptedText: string): string => {
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new AppError(
      'Invalid encrypted text format. Expected format: ivHex:encrypted',
      400
    );
  }

  const [ivHex, encrypted] = parts;
  if (!ivHex || !encrypted) {
    throw new AppError(
      'Invalid encrypted text format. Missing IV or encrypted data',
      400
    );
  }

  const cipher = crypto.createDecipheriv(
    config.encryptionAlgorithm,
    Buffer.from(config.encryptionKey, 'hex'),
    Buffer.from(ivHex, 'hex')
  );
  let decrypted = cipher.update(encrypted, 'hex', 'utf8');
  decrypted += cipher.final('utf8');
  return decrypted;
};

/**
 * Encrypts a given text using the specified algorithm and key.
 *
 * The function generates a random initialization vector (IV) for each encryption,
 * creates a cipher using the algorithm, key, and IV, and then encrypts the text.
 * The resulting encrypted text is returned in the format `iv:encryptedText`.
 *
 * @function encrypt
 * @param text The plaintext string to be encrypted
 * @returns {string} The encrypted text in the format `iv:encryptedText`
 */
const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    config.encryptionAlgorithm,
    Buffer.from(config.encryptionKey, 'hex'),
    iv
  );
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Validates the signature of a request body using HMAC and the specified algorithm.
 *
 * @function signatureValidator
 * @param requestBody The body of the request to validate
 * @param signature The HMAC signature to compare against
 * @param algorithm The HMAC algorithm to use for creating the digest
 * @returns {boolean} `true` if the signature is valid, `false` otherwise
 */
const signatureValidator = (
  stringifiedRequestBody: string,
  signature: string,
  algorithm: SignatureAlgorithm
): boolean => {
  // Create a digest from the request body using the specified algorithm.
  const hmac = crypto.createHmac(algorithm, config.intercomClientSecret);
  const digest = hmac.update(stringifiedRequestBody).digest('hex');

  return digest === signature;
};

export { encrypt, decrypt, signatureValidator };
