/**
 * Configuration interface for the application environment.
 *
 * @interface Config
 * @property {string} nodeEnv Node environment (e.g., 'development', 'production')
 * @property {boolean} isProduction Flag indicating if environment is production
 * @property {number} port Port number for the server to listen on
 * @property {string} logLevel Logging level configuration
 * @property {string} betterstackHeartbeatUrl URL for Betterstack health monitoring
 * @property {string} betterstackLogtailKey API key for Betterstack logging service
 * @property {string} pgDatabase PostgreSQL database name
 * @property {string} pgHost PostgreSQL host address
 * @property {string} pgPassword PostgreSQL database password
 * @property {number} pgPort PostgreSQL port number
 * @property {string} pgUser PostgreSQL username
 * @property {string} intercomClientId Intercom OAuth client ID
 * @property {string} intercomClientSecret Intercom OAuth client secret
 * @property {string} intercomCallbackUrl OAuth callback URL for Intercom
 * @property {string} intercomUrl Base URL for Intercom API
 * @property {string} encryptionAlgorithm Algorithm used for encryption
 * @property {string} encryptionKey Key used for encryption/decryption
 * @property {number} retryAttempts Maximum number of retry attempts
 * @property {number} retryFactor Exponential factor for retry backoff
 * @property {number} retryMinTimeout Minimum timeout between retries in milliseconds
 * @property {number} retryMaxTimeout Maximum timeout between retries in milliseconds
 * @property {boolean} retryRandomize Whether to randomize retry intervals
 * @property {string} sessionSecret Secret key for session management
 * @property {string} ipAllowlist Comma-separated list of allowed IP addresses
 */
export interface Config {
  readonly nodeEnv: string;
  readonly isProduction: boolean;
  readonly port: number;
  readonly logLevel: string;
  readonly betterstackHeartbeatUrl: string;
  readonly betterstackLogtailKey: string;
  readonly pgDatabase: string;
  readonly pgHost: string;
  readonly pgPassword: string;
  readonly pgPort: number;
  readonly pgUser: string;
  readonly intercomClientId: string;
  readonly intercomClientSecret: string;
  readonly intercomCallbackUrl: string;
  readonly intercomUrl: string;
  readonly encryptionAlgorithm: string;
  readonly encryptionKey: string;
  readonly retryAttempts: number;
  readonly retryFactor: number;
  readonly retryMinTimeout: number;
  readonly retryMaxTimeout: number;
  readonly retryRandomize: boolean;
  readonly sessionSecret: string;
  readonly ipAllowlist: string;
  readonly [key: string]: string | number | boolean;
}
