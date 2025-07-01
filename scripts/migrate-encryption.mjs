#!/usr/bin/env node

/**
 * Migration script for upgrading encrypted data from AES-256-CBC to AES-256-GCM
 * 
 * This script safely migrates existing encrypted data to the new secure format:
 * - Identifies records with old encryption format (2 parts: iv:encrypted)
 * - Decrypts using legacy method
 * - Re-encrypts using new AES-256-GCM format (4 parts: salt:iv:tag:encrypted)
 * - Updates database records with new encrypted values
 * - Provides rollback capability
 * 
 * Usage:
 *   node scripts/migrate-encryption.js [--dry-run] [--batch-size=100] [--rollback]
 * 
 * Options:
 *   --dry-run      Show what would be migrated without making changes
 *   --batch-size   Number of records to process at once (default: 100)
 *   --rollback     Rollback migration (requires backup data)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/config/db-config.js';
import { encrypt, decrypt, legacyDecrypt, CryptoService } from '../src/utilities/crypto-utility.js';
import config from '../src/config/config.js';
import logger from '../src/config/logger-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationLogger = logger.child({ module: 'encryption-migration' });

interface MigrationRecord {
  table: string;
  idColumn: string;
  encryptedColumn: string;
  id: string;
  oldValue: string;
  newValue?: string;
}

interface MigrationOptions {
  dryRun: boolean;
  batchSize: number;
  rollback: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {
    dryRun: false,
    batchSize: 100,
    rollback: false
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--rollback') {
      options.rollback = true;
    } else if (arg.startsWith('--batch-size=')) {
      options.batchSize = parseInt(arg.split('=')[1], 10) || 100;
    }
  }

  return options;
}

/**
 * Check if a value is in the old encryption format
 */
function isLegacyFormat(value: string): boolean {
  const parts = value.split(':');
  return parts.length === 2;
}

/**
 * Check if a value is in the new encryption format
 */
function isNewFormat(value: string): boolean {
  const parts = value.split(':');
  return parts.length === 4;
}

/**
 * Find all tables and columns that contain encrypted data
 */
async function findEncryptedColumns(): Promise<Array<{table: string, idColumn: string, encryptedColumn: string}>> {
  // Define known encrypted columns based on the application
  return [
    { table: 'users', idColumn: 'workspace_id', encryptedColumn: 'access_token' },
    { table: 'users', idColumn: 'workspace_id', encryptedColumn: 'authorization_code' },
    { table: 'messages', idColumn: 'id', encryptedColumn: 'message' }
  ];
}

/**
 * Get records that need migration
 */
async function getRecordsToMigrate(
  table: string, 
  idColumn: string, 
  encryptedColumn: string, 
  batchSize: number,
  offset: number = 0
): Promise<MigrationRecord[]> {
  const query = `
    SELECT ${idColumn} as id, ${encryptedColumn} as encrypted_value
    FROM ${table}
    WHERE ${encryptedColumn} IS NOT NULL
    ORDER BY ${idColumn}
    LIMIT $1 OFFSET $2
  `;
  
  const result = await pool.query(query, [batchSize, offset]);
  
  return result.rows
    .filter(row => isLegacyFormat(row.encrypted_value))
    .map(row => ({
      table,
      idColumn,
      encryptedColumn,
      id: row.id,
      oldValue: row.encrypted_value
    }));
}

/**
 * Migrate a single record
 */
async function migrateRecord(record: MigrationRecord): Promise<MigrationRecord> {
  try {
    // Decrypt using legacy method
    const decrypted = legacyDecrypt(record.oldValue);
    
    // Re-encrypt using new method
    const newEncrypted = await encrypt(decrypted);
    
    return {
      ...record,
      newValue: newEncrypted
    };
  } catch (error) {
    migrationLogger.error(`Failed to migrate record ${record.id} from ${record.table}`, {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Update database with new encrypted value
 */
async function updateRecord(record: MigrationRecord): Promise<void> {
  if (!record.newValue) {
    throw new Error('No new value to update');
  }

  const query = `
    UPDATE ${record.table}
    SET ${record.encryptedColumn} = $1
    WHERE ${record.idColumn} = $2
  `;
  
  await pool.query(query, [record.newValue, record.id]);
}

/**
 * Save migration backup
 */
async function saveBackup(records: MigrationRecord[]): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(__dirname, `migration-backup-${timestamp}.json`);
  
  const backup = {
    timestamp,
    records: records.map(r => ({
      table: r.table,
      idColumn: r.idColumn,
      encryptedColumn: r.encryptedColumn,
      id: r.id,
      oldValue: r.oldValue,
      newValue: r.newValue
    }))
  };
  
  await fs.promises.writeFile(backupPath, JSON.stringify(backup, null, 2));
  return backupPath;
}

/**
 * Load migration backup
 */
async function loadBackup(backupPath: string): Promise<MigrationRecord[]> {
  const backupData = await fs.promises.readFile(backupPath, 'utf-8');
  const backup = JSON.parse(backupData);
  return backup.records;
}

/**
 * Rollback migration from backup
 */
async function rollbackMigration(backupPath: string): Promise<void> {
  migrationLogger.info(`Rolling back migration from ${backupPath}`);
  
  const records = await loadBackup(backupPath);
  
  for (const record of records) {
    const query = `
      UPDATE ${record.table}
      SET ${record.encryptedColumn} = $1
      WHERE ${record.idColumn} = $2
    `;
    
    await pool.query(query, [record.oldValue, record.id]);
    migrationLogger.debug(`Rolled back ${record.table}:${record.id}`);
  }
  
  migrationLogger.info(`Rolled back ${records.length} records`);
}

/**
 * Verify migration by testing decryption
 */
async function verifyMigration(record: MigrationRecord): Promise<boolean> {
  if (!record.newValue) return false;
  
  try {
    // Decrypt old value
    const oldDecrypted = legacyDecrypt(record.oldValue);
    
    // Decrypt new value
    const newDecrypted = await decrypt(record.newValue);
    
    return oldDecrypted === newDecrypted;
  } catch (error) {
    migrationLogger.error(`Verification failed for ${record.table}:${record.id}`, {
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * Main migration function
 */
async function runMigration(options: MigrationOptions): Promise<void> {
  migrationLogger.info('Starting encryption migration', options);
  
  const encryptedColumns = await findEncryptedColumns();
  let totalMigrated = 0;
  let totalErrors = 0;
  const allMigratedRecords: MigrationRecord[] = [];
  
  for (const columnInfo of encryptedColumns) {
    migrationLogger.info(`Processing ${columnInfo.table}.${columnInfo.encryptedColumn}`);
    
    let offset = 0;
    let batchRecords: MigrationRecord[];
    
    do {
      batchRecords = await getRecordsToMigrate(
        columnInfo.table,
        columnInfo.idColumn,
        columnInfo.encryptedColumn,
        options.batchSize,
        offset
      );
      
      if (batchRecords.length === 0) break;
      
      migrationLogger.info(`Processing batch of ${batchRecords.length} records (offset: ${offset})`);
      
      const migratedRecords: MigrationRecord[] = [];
      
      for (const record of batchRecords) {
        try {
          const migratedRecord = await migrateRecord(record);
          
          // Verify the migration
          if (!await verifyMigration(migratedRecord)) {
            throw new Error('Migration verification failed');
          }
          
          migratedRecords.push(migratedRecord);
          
          if (!options.dryRun) {
            await updateRecord(migratedRecord);
          }
          
          totalMigrated++;
          
          migrationLogger.debug(`Migrated ${record.table}:${record.id}`);
        } catch (error) {
          totalErrors++;
          migrationLogger.error(`Failed to migrate ${record.table}:${record.id}`, {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      allMigratedRecords.push(...migratedRecords);
      offset += options.batchSize;
      
    } while (batchRecords.length === options.batchSize);
  }
  
  // Save backup if not dry run
  if (!options.dryRun && allMigratedRecords.length > 0) {
    const backupPath = await saveBackup(allMigratedRecords);
    migrationLogger.info(`Migration backup saved to: ${backupPath}`);
  }
  
  migrationLogger.info('Migration completed', {
    totalMigrated,
    totalErrors,
    dryRun: options.dryRun
  });
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const options = parseArgs();
    
    if (options.rollback) {
      const backupFiles = fs.readdirSync(__dirname)
        .filter(f => f.startsWith('migration-backup-') && f.endsWith('.json'))
        .sort()
        .reverse();
      
      if (backupFiles.length === 0) {
        throw new Error('No backup files found for rollback');
      }
      
      const latestBackup = path.join(__dirname, backupFiles[0]);
      await rollbackMigration(latestBackup);
    } else {
      await runMigration(options);
    }
  } catch (error) {
    migrationLogger.error('Migration failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runMigration, rollbackMigration, verifyMigration };