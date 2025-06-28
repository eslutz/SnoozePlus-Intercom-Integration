// Global test setup - mock external dependencies
jest.mock('../src/config/config');
jest.mock('../src/config/logger-config');

// Handle uncaught promise rejections in tests
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection in test:', reason);
});
