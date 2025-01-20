export interface Config {
  sessionSecret: string;
  pgDatabase: string;
  pgHost: string;
  pgPassword: string;
  pgUser: string;
  intercomClientId: string;
  intercomClientSecret: string;
  encryptionAlgorithm: string;
  encryptionKey: string;
  [key: string]: any;
}
