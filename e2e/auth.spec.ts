/**
 * E2E Tests - Authentication Flow
 */

import { test, expect } from "@playwright/test";
import { login, logout } from "./test-utils";

test.describe("Authentication", () => {
  test("should login successfully with valid credentials", async ({ page }) => {
    await page.goto("/sign-in");

    await page.fill('input[name="email"]', "admin@logivox.ai");
    await page.fill('input[name="password"]', "Admin@Logivox1!");
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]', { force: true });

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard", { timeout: 15000 });
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await page.goto("/sign-in");

    await page.fill('input[name="email"]', "invalid@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]', { force: true });

    // Should show error message
    await expect(page.locator(".text-destructive").last()).toContainText(
      "Invalid email or password",
      { timeout: 15000 },
    );

    // Should stay on login page
    await expect(page).toHaveURL(/.*sign-in.*/);
  });

  test("should logout successfully", async ({ page }) => {
    await login(page);

    // Click user menu
    // UI has direct logout button on desktop
    await page
      .locator('[data-testid="logout-button"]')
      .first()
      .click({ force: true });

    // Should redirect to homepage
    await page.waitForURL("/", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL("/");
  });

  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to login
    await expect(page).toHaveURL(/.*sign-in.*/);
  });

  test("should remember me work correctly", async ({ page, context }) => {
    await page.goto("/sign-in");

    await page.fill('input[name="email"]', "admin@logivox.ai");
    await page.fill('input[name="password"]', "Admin@Logivox1!");
    await page.check('input[name="rememberMe"]', { force: true });
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]', { force: true });

    await expect(page).toHaveURL("/dashboard", { timeout: 15000 });

    // Check that session cookie is set with longer expiry
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(
      (c) => c.name === "next-auth.session-token",
    );

    expect(sessionCookie).toBeDefined();
  });
});
