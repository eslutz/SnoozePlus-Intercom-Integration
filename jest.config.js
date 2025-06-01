/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: 'node',
  transform: {
    '^.+.tsx?$': ['ts-jest', {}],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/app.ts', // Exclude main app file due to ES module import.meta issue
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
