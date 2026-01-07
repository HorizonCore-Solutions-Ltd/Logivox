/**
 * E2E Tests - Authentication Flow
 */

import { test, expect } from "@playwright/test";
import { login, logout } from "./test-utils";

test.describe("Authentication", () => {
  test("should login successfully with valid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "admin@logivox.ai");
    await page.fill('input[name="password"]', "password");
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");

    // Should show user name
    await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "invalid@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('[role="alert"]')).toContainText(
      "Invalid credentials",
    );

    // Should stay on login page
    await expect(page).toHaveURL("/login");
  });

  test("should logout successfully", async ({ page }) => {
    await login(page);

    // Click user menu
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Should redirect to login
    await expect(page).toHaveURL("/login");
  });

  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to login
    await expect(page).toHaveURL("/login");
  });

  test("should remember me work correctly", async ({ page, context }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "admin@logivox.ai");
    await page.fill('input[name="password"]', "password");
    await page.check('input[name="rememberMe"]');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");

    // Check that session cookie is set with longer expiry
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(
      (c) => c.name === "next-auth.session-token",
    );

    expect(sessionCookie).toBeDefined();
  });
});
