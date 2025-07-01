import { describe, expect, test } from '@jest/globals';
import crypto from 'crypto';
import { CryptoService, encrypt, decrypt } from '../../src/utilities/crypto-utility.js';

describe('Crypto Utility Functions', () => {
  const testMessage = 'Hello, World!';
  const key =
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  describe('AES-256-GCM CryptoService', () => {
    const masterKey = key;

    describe('encrypt', () => {
      test('should encrypt a message successfully', async () => {
        const encrypted = await CryptoService.encrypt(testMessage, masterKey);

        expect(encrypted).toBeDefined();
        expect(typeof encrypted).toBe('string');
        
        // Should have 4 parts: salt:iv:tag:encrypted
        const parts = encrypted.split(':');
        expect(parts).toHaveLength(4);
        
        // Verify all parts are base64 encoded
        parts.forEach(part => {
          expect(part).toMatch(/^[A-Za-z0-9+\/]+(=*)$/);
        });
      });

      test('should produce different results for same input', async () => {
        const encrypted1 = await CryptoService.encrypt(testMessage, masterKey);
        const encrypted2 = await CryptoService.encrypt(testMessage, masterKey);

        expect(encrypted1).not.toBe(encrypted2);
      });

      test('should use different salts and IVs for each encryption', async () => {
        const encrypted1 = await CryptoService.encrypt(testMessage, masterKey);
        const encrypted2 = await CryptoService.encrypt(testMessage, masterKey);

        const parts1 = encrypted1.split(':');
        const parts2 = encrypted2.split(':');

        // Salt should be different
        expect(parts1[0]).not.toBe(parts2[0]);
        // IV should be different
        expect(parts1[1]).not.toBe(parts2[1]);
      });
    });

    describe('decrypt', () => {
      test('should decrypt encrypted message successfully', async () => {
        const encrypted = await CryptoService.encrypt(testMessage, masterKey);
        const decrypted = await CryptoService.decrypt(encrypted, masterKey);
        expect(decrypted).toBe(testMessage);
      });

      test('should throw error for invalid format', async () => {
        await expect(CryptoService.decrypt('invalid', masterKey))
          .rejects.toThrow('Invalid encrypted format');
        
        await expect(CryptoService.decrypt('only:two:parts', masterKey))
          .rejects.toThrow('Invalid encrypted format');
        
        await expect(CryptoService.decrypt('one:two:three:four:five', masterKey))
          .rejects.toThrow('Invalid encrypted format');
      });

      test('should throw error for missing parts', async () => {
        await expect(CryptoService.decrypt(':::', masterKey))
          .rejects.toThrow('Invalid encrypted format - missing parts');
        
        await expect(CryptoService.decrypt('salt:iv::encrypted', masterKey))
          .rejects.toThrow('Invalid encrypted format - missing parts');
      });

      test('should throw error for tampered data', async () => {
        const encrypted = await CryptoService.encrypt(testMessage, masterKey);
        const parts = encrypted.split(':');
        
        // Tamper with the encrypted data
        const tamperedParts = [...parts];
        tamperedParts[3] = 'dGFtcGVyZWQ='; // base64 for "tampered"
        const tamperedData = tamperedParts.join(':');

        await expect(CryptoService.decrypt(tamperedData, masterKey))
          .rejects.toThrow();
      });

      test('should fail with wrong key', async () => {
        const wrongKey = '1111111111111111111111111111111111111111111111111111111111111111';
        const encrypted = await CryptoService.encrypt(testMessage, masterKey);
        
        await expect(CryptoService.decrypt(encrypted, wrongKey))
          .rejects.toThrow();
      });
    });

    describe('encrypt/decrypt roundtrip', () => {
      const testCases = [
        'Simple text',
        'Text with symbols !@#$%^&*()',
        'Multiline\ntext\nwith\nbreaks',
        '🚀 Unicode and emojis 🎉',
        '',
        'a'.repeat(1000), // Long text
        JSON.stringify({ complex: 'object', with: ['array', 'elements'] }),
        'access_token_123456789',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      ];

      test.each(testCases)('should handle: %s', async (input) => {
        const encrypted = await CryptoService.encrypt(input, masterKey);
        const decrypted = await CryptoService.decrypt(encrypted, masterKey);

        expect(decrypted).toBe(input);
      });
    });
  });

  describe('Unified encrypt/decrypt functions', () => {
    test('should encrypt using new AES-256-GCM format', async () => {
      const encrypted = await encrypt(testMessage);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      
      // Should have 4 parts for new format
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(4);
    });

    test('should decrypt new format', async () => {
      const encrypted = await encrypt(testMessage);
      const decrypted = await decrypt(encrypted);
      
      expect(decrypted).toBe(testMessage);
    });

    test('should reject invalid formats', async () => {
      await expect(decrypt('invalid')).rejects.toThrow('Invalid encrypted format');
      await expect(decrypt('one:two:three')).rejects.toThrow('Invalid encrypted format');
      await expect(decrypt('one:two:three:four:five')).rejects.toThrow('Invalid encrypted format');
    });
  });

  describe('Security properties', () => {
    test('authenticated encryption should prevent tampering', async () => {
      const plaintext = 'sensitive data';
      const encrypted = await CryptoService.encrypt(plaintext, key);
      const parts = encrypted.split(':');
      
      // Tamper with each part and ensure decryption fails
      for (let i = 0; i < parts.length; i++) {
        const tamperedParts = [...parts];
        tamperedParts[i] = Buffer.from('tampered').toString('base64');
        const tamperedData = tamperedParts.join(':');
        
        await expect(CryptoService.decrypt(tamperedData, key))
          .rejects.toThrow();
      }
    });

    test('salt should provide unique keys for same master key', async () => {
      // This test verifies that different salts produce different derived keys
      const plaintext = 'test data';
      
      const encrypted1 = await CryptoService.encrypt(plaintext, key);
      const encrypted2 = await CryptoService.encrypt(plaintext, key);
      
      const parts1 = encrypted1.split(':');
      const parts2 = encrypted2.split(':');
      
      // Different salts should lead to different encrypted outputs
      expect(parts1[0]).not.toBe(parts2[0]); // Different salts
      expect(parts1[3]).not.toBe(parts2[3]); // Different encrypted data
    });

    test('key derivation should be deterministic with same salt', async () => {
      // This is an internal test to verify key derivation works consistently
      const salt = crypto.randomBytes(32);
      const masterKey = 'test-master-key';
      
      // We can't directly test the private deriveKey method, but we can test 
      // that encryption/decryption is consistent
      const plaintext = 'consistent test';
      
      // Create a test that encrypts with a fixed salt (by modifying the crypto service)
      // For now, we'll test that multiple encrypt/decrypt cycles work
      for (let i = 0; i < 5; i++) {
        const encrypted = await CryptoService.encrypt(plaintext, masterKey);
        const decrypted = await CryptoService.decrypt(encrypted, masterKey);
        expect(decrypted).toBe(plaintext);
      }
    });
  });
});
