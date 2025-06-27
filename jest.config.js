/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/app.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^../src/config/config$': '<rootDir>/tests/__mocks__/config.ts',
    '^../src/config/logger-config$':
      '<rootDir>/tests/__mocks__/logger-config.ts',
    '^../src/config/db-config$': '<rootDir>/tests/mocks/db-config.ts',
    '^../src/services/message-db-service$':
      '<rootDir>/tests/mocks/message-db-service.ts',
    '^../src/services/user-db-service$':
      '<rootDir>/tests/mocks/user-db-service.ts',
    '^../src/services/heartbeat-service$':
      '<rootDir>/tests/mocks/heartbeat-service.ts',
    '^../src/services/intercom-service$':
      '<rootDir>/tests/mocks/intercom-service.ts',
    '^node-fetch$': '<rootDir>/tests/mocks/node-fetch.ts',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 10000,
  clearMocks: true,
  globalTeardown: '<rootDir>/tests/jest-teardown.js',
  forceExit: true,
  resetMocks: true,
  restoreMocks: true,
};
