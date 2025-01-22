/**
 * Configuration module for the application.
 *
 * @module config
 * @exports config The validated configuration object
 * @throws {Error} Will throw an error during validation if required fields are missing
 * @remarks This module exports a configuration object that is populated from environment
 * variables with fallback default values. The configuration is validated on load to ensure
 * all required fields are present. *
 */
import { Config } from '../models/config-model';

const config: Config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  sessionSecret: process.env.SESSION_SECRET ?? '',
  betterstackHeartbeatUrl: process.env.BETTERSTACK_HEARTBEAT_URL ?? '',
  betterstackLogtailKey: process.env.BETTERSTACK_LOGTAIL_KEY ?? '',
  logLevel:
    process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === 'production' ? 'http' : 'debug'),
  pgDatabase: process.env.PGDATABASE ?? '',
  pgHost: process.env.PGHOST ?? '',
  pgPassword: process.env.PGPASSWORD ?? '',
  pgPort: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  pgUser: process.env.PGUSER ?? '',
  intercomClientId: process.env.INTERCOM_CLIENT_ID ?? '',
  intercomClientSecret: process.env.INTERCOM_CLIENT_SECRET ?? '',
  intercomCallbackUrl:
    process.env.INTERCOM_CALLBACK_URL ?? '/auth/intercom/callback',
  intercomUrl: process.env.INTERCOM_URL ?? 'https://api.intercom.io',
  encryptionAlgorithm: process.env.ENCRYPTION_ALGORITHM ?? '',
  encryptionKey: process.env.ENCRYPTION_KEY ?? '',
  retryAttempts: process.env.RETRY_ATTEMPTS
    ? Number(process.env.RETRY_ATTEMPTS)
    : 3,
  retryFactor: process.env.RETRY_FACTOR ? Number(process.env.RETRY_FACTOR) : 2,
  retryMinTimeout: process.env.RETRY_MIN_TIMEOUT
    ? Number(process.env.RETRY_MIN_TIMEOUT)
    : 1000,
  retryMaxTimeout: process.env.RETRY_MAX_TIMEOUT
    ? Number(process.env.RETRY_MAX_TIMEOUT)
    : 5000,
  retryRandomize: process.env.RETRY_RANDOMIZE === 'true',
  ipAllowlist: process.env.IP_ALLOWLIST ?? '',
};

/**
 * Validates the configuration object by checking for required fields.
 *
 * @function validateConfig
 * @param {Config} config - The configuration object to validate
 * @throws {Error} Throws an error if any required fields are missing or empty
 * @remarks Empty strings (or strings containing only whitespace) are considered invalid values
 */
const validateConfig = (config: Config) => {
  const requiredFields = [
    'sessionSecret',
    'pgDatabase',
    'pgHost',
    'pgPassword',
    'pgUser',
    'intercomClientId',
    'intercomClientSecret',
    'encryptionAlgorithm',
    'encryptionKey',
  ];

  const missingFields: string[] = requiredFields.filter((field) => {
    const value = config[field];
    if (typeof value === 'string') {
      return !value || value.trim() === '';
    }
    return value === null || value === undefined;
  });

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required configuration values: ${missingFields.join(', ')}`
    );
  }
};

// Validate the configuration.
// If validation fails, log the error and exit the process.
validateConfig(config);

export default config;
