/**
 * Playwright Global Setup
 * Runs once before all tests
 */

import { chromium, FullConfig } from "@playwright/test";
import { execSync } from "child_process";

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting global setup...");

  // Start the development server is handled by webServer in config

  // Seed test database
  console.log("📦 Seeding test database...");
  try {
    execSync("npx prisma db seed", { stdio: "inherit" });
  } catch (error) {
    console.error("Failed to seed database:", error);
  }

  // Create test users
  console.log("👤 Creating test users (pre-warming server)...");
  try {
    const URL = config.projects[0].use.baseURL || "http://localhost:3000";
    await fetch(URL);
    console.log("✅ App is running at:", URL);
  } catch (err) {
    console.log("⚠️ Could not pre-warm server. It may still be booting.", err);
  }

  console.log("✅ Global setup complete");
}

export default globalSetup;
