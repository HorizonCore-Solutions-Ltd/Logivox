/**
 * Playwright Global Setup
 * Runs once before all tests
 */

import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting global setup...");

  // Start the development server is handled by webServer in config

  // Seed test database
  console.log("📦 Seeding test database...");
  // await seedTestDatabase();

  // Create test users
  console.log("👤 Creating test users...");
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to app to ensure it's running
  const baseURL = config.projects[0].use.baseURL || "http://localhost:3000";
  await page.goto(baseURL);
  await page.waitForLoadState("domcontentloaded");

  console.log("✅ App is running at:", baseURL);

  await browser.close();

  console.log("✅ Global setup complete");
}

export default globalSetup;
