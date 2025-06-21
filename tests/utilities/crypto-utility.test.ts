import { describe, expect, test } from '@jest/globals';
import crypto from 'crypto';

// Simple crypto utility functions for testing
const encryptText = (text: string, algorithm: string, key: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

const decryptText = (encryptedText: string, algorithm: string, key: string): string => {
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format. Expected format: ivHex:encrypted');
  }
  
  const [ivHex, encrypted] = parts;
  if (!ivHex || !encrypted) {
    throw new Error('Invalid encrypted text format. Missing IV or encrypted data');
  }
  
  const cipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(ivHex, 'hex'));
  let decrypted = cipher.update(encrypted, 'hex', 'utf8');
  decrypted += cipher.final('utf8');
  return decrypted;
};

describe('Crypto Utility Functions', () => {
  const testMessage = 'Hello, World!';
  const algorithm = 'AES-256-CBC';
  const key = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  
  describe('encrypt', () => {
    test('should encrypt a message successfully', () => {
      const encrypted = encryptText(testMessage, algorithm, key);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).toContain(':');
      
      // Should have IV and encrypted parts
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toHaveLength(32); // IV hex length
    });

    test('should produce different results for same input', () => {
      const encrypted1 = encryptText(testMessage, algorithm, key);
      const encrypted2 = encryptText(testMessage, algorithm, key);
      
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decrypt', () => {
    test('should decrypt encrypted message successfully', () => {
      const encrypted = encryptText(testMessage, algorithm, key);
      const decrypted = decryptText(encrypted, algorithm, key);
      
      expect(decrypted).toBe(testMessage);
    });

    test('should throw error for invalid format', () => {
      expect(() => decryptText('invalid', algorithm, key)).toThrow('Invalid encrypted text format');
      expect(() => decryptText('invalid:format:too:many:parts', algorithm, key)).toThrow('Invalid encrypted text format');
    });

    test('should throw error for missing parts', () => {
      expect(() => decryptText(':', algorithm, key)).toThrow('Invalid encrypted text format');
      expect(() => decryptText('onlyonepart', algorithm, key)).toThrow('Invalid encrypted text format');
    });
  });

  describe('encrypt/decrypt roundtrip', () => {
    const testCases = [
      'Simple text',
      'Text with symbols !@#$%^&*()',
      'Multiline\ntext\nwith\nbreaks',
      '🚀 Unicode and emojis 🎉',
      '',
      'a'.repeat(100), // Long text
    ];

    test.each(testCases)('should handle: %s', (input) => {
      const encrypted = encryptText(input, algorithm, key);
      const decrypted = decryptText(encrypted, algorithm, key);
      
      expect(decrypted).toBe(input);
    });
  });
});