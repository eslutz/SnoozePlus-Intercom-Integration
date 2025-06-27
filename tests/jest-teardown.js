// Jest global teardown
// This runs after all tests complete
module.exports = async () => {
  // Close any open handles
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Force cleanup of any remaining resources
  if (global.gc) {
    global.gc();
  }
};
