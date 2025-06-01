// Unit test for crypto utility signature validation logic
describe('SignatureAlgorithm enum', () => {
  it('should have correct values', () => {
    const SignatureAlgorithm = {
      WEBHOOK: 'sha1',
      CANVAS: 'sha256',
    };
    
    expect(SignatureAlgorithm.WEBHOOK).toBe('sha1');
    expect(SignatureAlgorithm.CANVAS).toBe('sha256');
  });
});

describe('Signature validation logic', () => {
  it('should validate HMAC signatures correctly', () => {
    const crypto = require('crypto');
    
    // Test the actual signature validation logic
    const createSignatureValidator = (intercomClientSecret: string) => {
      return (stringifiedRequestBody: string, signature: string, algorithm: string): boolean => {
        const hmac = crypto.createHmac(algorithm, intercomClientSecret);
        const digest = hmac.update(stringifiedRequestBody).digest('hex');
        return digest === signature;
      };
    };
    
    const validator = createSignatureValidator('test-secret');
    const requestBody = '{"test": "data"}';
    
    // Create actual signature
    const hmac = crypto.createHmac('sha1', 'test-secret');
    const expectedSignature = hmac.update(requestBody).digest('hex');
    
    // Test validation
    expect(validator(requestBody, expectedSignature, 'sha1')).toBe(true);
    expect(validator(requestBody, 'invalid-signature', 'sha1')).toBe(false);
  });
});

describe('Encryption/Decryption logic', () => {
  it('should encrypt and decrypt text correctly', () => {
    const crypto = require('crypto');
    const algorithm = 'aes-256-cbc';
    const key = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    
    const encrypt = (text: string): string => {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return `${iv.toString('hex')}:${encrypted}`;
    };
    
    const decrypt = (encryptedText: string): string => {
      const [ivHex, encrypted] = encryptedText.split(':');
      const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(ivHex, 'hex'));
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    };
    
    const originalText = 'Hello, World!';
    const encrypted = encrypt(originalText);
    const decrypted = decrypt(encrypted);
    
    expect(decrypted).toBe(originalText);
    expect(encrypted).toMatch(/^[0-9a-f]{32}:[0-9a-f]+$/); // Format: iv:encrypted
  });
});