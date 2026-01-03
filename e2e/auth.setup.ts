import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Go to login page
  await page.goto('http://localhost:3000/login');

  // Perform authentication steps
  await page.fill('[name="email"]', 'test@logivox.com');
  await page.fill('[name="password"]', 'Test123!@#');
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard');

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
