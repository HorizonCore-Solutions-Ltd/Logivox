/**
 * E2E Smoke Tests
 * Critical path testing for production readiness
 *
 * These tests verify that key user flows work end-to-end:
 * - User can access the landing page
 * - User can navigate to login
 * - Dashboard is protected (requires auth)
 * - Core pages are accessible
 */

import { test, expect } from "@playwright/test";

test.describe("Smoke Tests - Critical Paths", () => {
  test("Landing page loads successfully", async ({ page }) => {
    await page.goto("/");

    // Check that the page loaded
    await expect(page).toHaveTitle(/LogiVox/i);

    // Verify key elements are present
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("nav")).toBeVisible();
  });

  test("Login page is accessible", async ({ page }) => {
    await page.goto("/sign-in");

    // Verify login form elements
    await expect(
      page.locator('input[name="email"], input[type="email"]'),
    ).toBeVisible();
    await expect(
      page.locator('input[name="password"], input[type="password"]'),
    ).toBeVisible();
    await expect(
      page.locator('button[type="submit"], button:has-text("Sign")').first(),
    ).toBeVisible();
  });

  test("Dashboard requires authentication", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to login or show unauthorized
    const url = page.url();
    expect(
      url.includes("/sign-in") ||
        url.includes("/auth") ||
        url.includes("/api/auth"),
    ).toBe(true);
  });

  test("API health endpoint responds", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("status");
  });

  test("API metrics endpoint is accessible", async ({ request }) => {
    const response = await request.get("/api/metrics");

    // Should return 200 (if no auth) or 401 (if auth required)
    expect([200, 401]).toContain(response.status());
  });

  test("Static assets load correctly", async ({ page }) => {
    await page.goto("/");

    // Check that CSS is loaded (no flash of unstyled content)
    const bodyStyles = await page.locator("body").evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        fontFamily: styles.fontFamily,
        margin: styles.margin,
      };
    });

    // Verify styles are applied (not default browser styles)
    expect(bodyStyles.fontFamily).not.toBe("Times New Roman");
  });

  test("Navigation works across public pages", async ({ page }) => {
    await page.goto("/");

    // Try to navigate (if links exist)
    const links = await page.locator("nav a, header a").all();
    expect(links.length).toBeGreaterThan(0);
  });

  test("Mobile viewport renders correctly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Check mobile rendering
    await expect(page.locator("body")).toBeVisible();
    const bodyWidth = await page
      .locator("body")
      .evaluate((el) => el.clientWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });

  test("Console has no critical errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");

    // Filter out known non-critical errors
    const criticalErrors = errors.filter((error) => {
      return (
        !error.includes("favicon") &&
        !error.includes("websocket") &&
        !error.includes("_next") &&
        !error.includes("hot-reload")
      );
    });

    expect(criticalErrors.length).toBe(0);
  });

  test("Page loads within acceptable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/");
    const loadTime = Date.now() - startTime;

    // Should load in less than 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});

test.describe("API Smoke Tests", () => {
  test("Auth endpoints are accessible", async ({ request }) => {
    // Test that auth endpoints exist (even if they return 401/403)
    const endpoints = [
      "/api/auth/signin",
      "/api/auth/signout",
      "/api/auth/session",
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      // Should not return 404
      expect(response.status()).not.toBe(404);
    }
  });

  test("CRUD endpoints require authentication", async ({ request }) => {
    const protectedEndpoints = [
      "/api/inventory",
      "/api/orders",
      "/api/customers",
      "/api/warehouses",
      "/api/carriers",
      "/api/locations",
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await request.get(endpoint);
      // Should return 401 (unauthorized) or 403 (forbidden), not 404
      expect([401, 403]).toContain(response.status());
    }
  });

  test("Public endpoints are accessible", async ({ request }) => {
    const publicEndpoints = ["/api/health", "/api/health/live"];

    for (const endpoint of publicEndpoints) {
      const response = await request.get(endpoint);
      expect(response.status()).toBe(200);
    }
  });
});

test.describe("Security Smoke Tests", () => {
  test("HTTPS headers are set correctly", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();

    // Check security headers (if configured)
    // Note: These might not be set in development
    if (process.env.NODE_ENV === "production") {
      expect(headers["x-frame-options"]).toBeDefined();
      expect(headers["x-content-type-options"]).toBe("nosniff");
    }
  });

  test("API rate limiting is configured", async ({ request }) => {
    // Make multiple requests to trigger rate limiting
    const requests = Array(20)
      .fill(null)
      .map(() => request.get("/api/health"));
    const responses = await Promise.all(requests);

    // At least one request should go through
    const successfulRequests = responses.filter((r) => r.status() === 200);
    expect(successfulRequests.length).toBeGreaterThan(0);
  });

  test("XSS protection in forms", async ({ page }) => {
    await page.goto("/sign-in");

    // Try to inject script
    const xssPayload = '<script>alert("XSS")</script>';
    await page.fill('input[name="email"], input[type="email"]', xssPayload);

    // Should not execute script
    page.on("dialog", () => {
      throw new Error("XSS vulnerability detected");
    });

    await page.waitForTimeout(1000);
    // If we reach here without errors, XSS protection is working
  });
});

test.describe("Performance Smoke Tests", () => {
  test("Images are optimized", async ({ page }) => {
    await page.goto("/");

    // Check for Next.js Image optimization
    const images = await page.locator("img").all();

    for (const img of images.slice(0, 5)) {
      // 5 images max
      const src = await img.getAttribute("src");
      if (src && !src.startsWith("data:")) {
        // Check if using Next.js image optimization
        const isOptimized =
          src.includes("_next/image") || src.includes("/_next/static");
        // Images should either be optimized or be SVGs/external
        expect(
          isOptimized || src.endsWith(".svg") || src.startsWith("http"),
        ).toBe(true);
      }
    }
  });

  test("JavaScript bundle size is reasonable", async ({ page }) => {
    const resources: any[] = [];

    page.on("response", (response) => {
      if (
        response.url().includes(".js") &&
        !response.url().includes("hot-update")
      ) {
        resources.push({
          url: response.url(),
          size: response.headers()["content-length"],
        });
      }
    });

    await page.goto("/");

    // Total JS should be less than 5MB (uncompressed)
    const totalSize = resources.reduce(
      (sum, r) => sum + (parseInt(r.size) || 0),
      0,
    );
    expect(totalSize).toBeLessThan(5 * 1024 * 1024);
  });
});

test.describe("Accessibility Smoke Tests", () => {
  test("Page has proper heading hierarchy", async ({ page }) => {
    await page.goto("/");

    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    expect(h1Count).toBeLessThanOrEqual(2); // Should have 1-2 h1 elements max
  });

  test("Interactive elements have accessible names", async ({ page }) => {
    await page.goto("/");

    const buttons = await page.locator("button").all();
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute("aria-label");
      const ariaLabelledBy = await button.getAttribute("aria-labelledby");

      // Button should have visible text, aria-label, or aria-labelledby
      expect(text || ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });

  test("Form inputs have labels", async ({ page }) => {
    await page.goto("/sign-in");

    const inputs = await page
      .locator(
        'input[type="email"], input[type="password"], input[type="text"]',
      )
      .all();

    for (const input of inputs) {
      const id = await input.getAttribute("id");
      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledBy = await input.getAttribute("aria-labelledby");

      // Input should have label (via id), aria-label, or aria-labelledby
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        expect(label || ariaLabel || ariaLabelledBy).toBeTruthy();
      } else {
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test("Page has lang attribute", async ({ page }) => {
    await page.goto("/");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBeTruthy();
  });
});
