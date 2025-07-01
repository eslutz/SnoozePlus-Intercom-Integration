#!/usr/bin/env node

/**
 * Migration script for AES-256-GCM encryption
 * 
 * Since the application isn't in production yet, this script simply validates
 * that the new encryption system is working correctly.
 * 
 * Usage:
 *   node scripts/migrate-encryption.js [--test]
 * 
 * Options:
 *   --test     Run encryption validation tests
 */

import { encrypt, decrypt, CryptoService } from '../dist/utilities/crypto-utility.js';
import config from '../dist/config/config.js';
import logger from '../dist/config/logger-config.js';

const migrationLogger = logger.child({ module: 'encryption-validation' });

/**
 * Validates that the encryption system is working correctly
 */
async function validateEncryption() {
  const testData = [
    'simple test',
    'test with special chars !@#$%^&*()',
    'longer test data to ensure the encryption handles variable length content properly',
    '',
    '🚀 Unicode test with emojis 🎉'
  ];

  migrationLogger.info('Starting encryption validation...');

  for (const data of testData) {
    try {
      // Test encryption/decryption cycle
      const encrypted = await encrypt(data);
      const decrypted = await decrypt(encrypted);

      if (decrypted !== data) {
        throw new Error(`Data mismatch: expected "${data}", got "${decrypted}"`);
      }

      // Verify format (should be 4 parts: salt:iv:tag:encrypted)
      const parts = encrypted.split(':');
      if (parts.length !== 4) {
        throw new Error(`Invalid format: expected 4 parts, got ${parts.length}`);
      }

      migrationLogger.debug(`✅ Validated encryption for: "${data.substring(0, 20)}${data.length > 20 ? '...' : ''}"`);
    } catch (error) {
      migrationLogger.error(`❌ Validation failed for: "${data}"`, { error: error.message });
      throw error;
    }
  }

  migrationLogger.info('✅ All encryption validation tests passed');
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const isTest = args.includes('--test');

  try {
    if (isTest) {
      migrationLogger.info('Running encryption validation tests...');
    } else {
      migrationLogger.info('Validating encryption configuration...');
    }

    await validateEncryption();

    migrationLogger.info('🎉 Encryption system validation completed successfully');
    process.exit(0);
  } catch (error) {
    migrationLogger.error('💥 Encryption validation failed', { 
      error: error.message,
      stack: error.stack 
    });
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}