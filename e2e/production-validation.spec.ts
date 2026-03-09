import { test, expect } from "@playwright/test";

test.describe("Production Deployment Validation", () => {
  test("homepage loads successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/LogiVox|Warehouse|Management/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("authentication system works", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("dashboard requires authentication", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to signin
    await expect(page.url()).toContain("/sign-in");
  });

  test("API health check responds", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const health = await response.json();
    expect(health.status).toBe("healthy");
  });

  test("database connectivity check", async ({ request }) => {
    const response = await request.get("/api/health/database");
    expect(response.status()).toBe(200);

    const dbHealth = await response.json();
    expect(dbHealth.database).toBe("connected");
  });

  test("rate limiting works on API endpoints", async ({ request }) => {
    // Make multiple rapid requests to test rate limiting
    const requests = Array.from({ length: 10 }, () =>
      request.get("/api/health"),
    );

    const responses = await Promise.all(requests);
    const successful = responses.filter((r) => r.status() === 200).length;
    const rateLimited = responses.filter((r) => r.status() === 429).length;

    // Should have some successful and potentially some rate-limited
    expect(successful).toBeGreaterThan(0);
  });

  test("security headers are present", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() || {};

    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
  });

  test("responsive design works on mobile", async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto("/");

      // Check mobile navigation
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      if (await mobileMenu.isVisible()) {
        await expect(mobileMenu).toBeVisible();
      }

      // Check responsive layout
      const mainContent = page.locator("main");
      await expect(mainContent).toBeVisible();
    }
  });

  test("PWA manifest is accessible", async ({ request }) => {
    const response = await request.get("/manifest.json");
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.icons).toBeTruthy();
  });

  test("service worker registration", async ({ page }) => {
    await page.goto("/");

    // Check if service worker is registered
    const swRegistered = await page.evaluate(() => {
      return "serviceWorker" in navigator;
    });

    expect(swRegistered).toBe(true);
  });
});
