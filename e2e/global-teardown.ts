/**
 * Playwright Global Teardown
 * Runs once after all tests
 */

async function globalTeardown() {
  console.log('🧹 Starting global teardown...');
  
  // Clean up test database
  console.log('🗑️  Cleaning up test data...');
  // await cleanupTestDatabase();
  
  console.log('✅ Global teardown complete');
}

export default globalTeardown;
