import crypto from 'crypto';
import { promisify } from 'util';
import config from '../config/config.js';
import SignatureAlgorithm from '../enums/signature-algorithm-enum.js';
import { AppError } from '../middleware/error-middleware.js';

const scrypt = promisify(crypto.scrypt);

/**
 * Secure cryptography service using AES-256-GCM authenticated encryption
 * with proper key derivation and tamper protection.
 */
class CryptoService {
  private static readonly SALT_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly KEY_LENGTH = 32;

  /**
   * Derives a key from the master key using scrypt
   */
  private static async deriveKey(
    masterKey: string,
    salt: Buffer
  ): Promise<Buffer> {
    return (await scrypt(masterKey, salt, this.KEY_LENGTH)) as Buffer;
  }

  /**
   * Encrypts text using AES-256-GCM with authenticated encryption
   */
  static async encrypt(text: string, masterKey: string): Promise<string> {
    const salt = crypto.randomBytes(this.SALT_LENGTH);
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const key = await this.deriveKey(masterKey, salt);

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    // Format: salt:iv:tag:encrypted
    return [
      salt.toString('base64'),
      iv.toString('base64'),
      tag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  /**
   * Decrypts text encrypted with encrypt method
   */
  static async decrypt(
    encryptedText: string,
    masterKey: string
  ): Promise<string> {
    const parts = encryptedText.split(':');
    if (parts.length !== 4) {
      throw new AppError('Invalid encrypted format', 400);
    }

    const [saltB64, ivB64, tagB64, encryptedB64] = parts;

    // Allow empty encrypted data (for empty strings) but not other parts
    if (!saltB64 || !ivB64 || !tagB64 || encryptedB64 === undefined) {
      throw new AppError('Invalid encrypted format - missing parts', 400);
    }

    const salt = Buffer.from(saltB64, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const encrypted = Buffer.from(encryptedB64, 'base64');

    const key = await this.deriveKey(masterKey, salt);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}

/**
 * Decrypts text using the secure AES-256-GCM format.
 */
const decrypt = async (encryptedText: string): Promise<string> => {
  return await CryptoService.decrypt(encryptedText, config.encryptionKey);
};

/**
 * Encrypts text using the new secure AES-256-GCM format.
 */
const encrypt = async (text: string): Promise<string> => {
  return await CryptoService.encrypt(text, config.encryptionKey);
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

export { encrypt, decrypt, signatureValidator, CryptoService };
