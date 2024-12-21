import crypto from 'crypto';
import SignatureHmacAlgorithm from '../enums/signature-hmac-algorithm-enum';

const algorithm = process.env.ENCRYPTION_ALGORITHM;
if (!algorithm) {
  throw new Error('ENCRYPTION_ALGORITHM cannot be found!');
}
const key = process.env.ENCRYPTION_KEY;
if (!key) {
  throw new Error('ENCRYPTION_KEY cannot be found!');
}
const clientSecret = process.env.INTERCOM_CLIENT_SECRET;
if (!clientSecret) {
  throw new Error('INTERCOM_CLIENT_SECRET cannot be found!');
}

/**
 * Decrypts an encrypted text using a specified algorithm and key.
 *
 * The encrypted text should be in the format `ivHex:encrypted`, where `ivHex` is the initialization vector
 * in hexadecimal format and `encrypted` is the encrypted data in hexadecimal format.
 *
 * @param encryptedText - The encrypted text to decrypt, in the format `ivHex:encrypted`.
 * @returns The decrypted text in UTF-8 format.
 */
const decrypt = (encryptedText: string): string => {
  const [ivHex, encrypted] = encryptedText.split(':');
  const cipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(key, 'hex'),
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
 * @param text - The plaintext string to be encrypted.
 * @returns The encrypted text in the format `iv:encryptedText`.
 */
const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Validates the signature of a request body using HMAC and the specified algorithm.
 *
 * @param requestBody - The body of the request to validate.
 * @param signature - The HMAC signature to compare against.
 * @param algorithm - The HMAC algorithm to use for creating the digest.
 * @returns `true` if the signature is valid, `false` otherwise.
 */
const signatureValidator = (
  requestBody: Request['body'],
  signature: string,
  algorithm: SignatureHmacAlgorithm
): boolean => {
  const stringifiedBody = JSON.stringify(requestBody);

  // Create a digest from the request body using the specified algorithm.
  const hmac = crypto.createHmac(algorithm, clientSecret);
  const digest = hmac.update(stringifiedBody).digest('hex');

  return digest === signature;
};

export { encrypt, decrypt, signatureValidator };
