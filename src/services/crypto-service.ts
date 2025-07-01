import { injectable } from 'inversify';
import crypto from 'crypto';
import { promisify } from 'util';
import type { ICryptoService } from '../container/interfaces.js';
import config from '../config/config.js';
import SignatureAlgorithm from '../enums/signature-algorithm-enum.js';
import { AppError } from '../middleware/error-middleware.js';

const scrypt = promisify(crypto.scrypt);

/**
 * Injectable crypto service for encryption, decryption and signature validation
 */
@injectable()
export class CryptoService implements ICryptoService {
  private static readonly SALT_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly KEY_LENGTH = 32;

  // Empty constructor required by injectable pattern
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  /**
   * Derives a key from the master key using scrypt
   */
  private async deriveKey(masterKey: string, salt: Buffer): Promise<Buffer> {
    return (await scrypt(masterKey, salt, CryptoService.KEY_LENGTH)) as Buffer;
  }

  /**
   * Encrypts text using AES-256-GCM with authenticated encryption
   * 
   * @param text - The plaintext string to encrypt
   * @returns Promise resolving to base64-encoded encrypted string with salt, IV, tag, and ciphertext
   * @throws {Error} When encryption fails or text is invalid
   */
  public async encrypt(text: string): Promise<string> {
    const salt = crypto.randomBytes(CryptoService.SALT_LENGTH);
    const iv = crypto.randomBytes(CryptoService.IV_LENGTH);
    const key = await this.deriveKey(config.encryptionKey, salt);

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    // Format: salt:iv:tag:encrypted
    const result = [
      salt.toString('base64'),
      iv.toString('base64'),
      tag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');

    return result;
  }

  /**
   * Decrypts text encrypted with encrypt method
   * 
   * @param encryptedText - Base64-encoded encrypted string with format "salt:iv:tag:ciphertext"
   * @returns Promise resolving to the original plaintext string
   * @throws {AppError} When decryption fails or format is invalid
   */
  public async decrypt(encryptedText: string): Promise<string> {
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

    const key = await this.deriveKey(config.encryptionKey, salt);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  /**
   * Validates the signature of a request body using HMAC and the specified algorithm.
   *
   * @param stringifiedRequestBody The body of the request to validate
   * @param signature The HMAC signature to compare against
   * @param algorithm The HMAC algorithm to use for creating the digest
   * @returns {boolean} `true` if the signature is valid, `false` otherwise
   */
  signatureValidator(
    stringifiedRequestBody: string,
    signature: string,
    algorithm: SignatureAlgorithm
  ): boolean {
    // Create a digest from the request body using the specified algorithm.
    const hmac = crypto.createHmac(algorithm, config.intercomClientSecret);
    const digest = hmac.update(stringifiedRequestBody).digest('hex');

    const isValid = digest === signature;

    return isValid;
  }
}
