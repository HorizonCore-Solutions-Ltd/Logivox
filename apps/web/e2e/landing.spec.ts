import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display navigation with all links", async ({ page }) => {
    // Check logo
    await expect(page.getByText("LogiVox")).toBeVisible();

    // Check main navigation items
    await expect(page.getByRole("button", { name: "Solutions" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Platform" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Pricing" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Resources" })).toBeVisible();
    await expect(page.getByRole("link", { name: "About" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Contact" })).toBeVisible();
  });

  test("should display hero section with CTAs", async ({ page }) => {
    // Check hero headline
    await expect(page.getByText("Enterprise")).toBeVisible();
    await expect(page.getByText("Stock Booking")).toBeVisible();
    await expect(page.getByText("Platform")).toBeVisible();

    // Check CTA buttons
    const startTrialBtn = page.getByRole("link", { name: /start free trial/i });
    const demoBtn = page.getByRole("link", { name: /watch demo/i });

    await expect(startTrialBtn).toBeVisible();
    await expect(demoBtn).toBeVisible();

    // Verify links
    await expect(startTrialBtn).toHaveAttribute("href", "/sign-up");
    await expect(demoBtn).toHaveAttribute("href", "/demo");
  });

  test("should navigate to pricing page", async ({ page }) => {
    await page.getByRole("link", { name: "Pricing" }).click();
    await expect(page).toHaveURL("/pricing");
    await expect(page.getByText(/pricing for everyone/i)).toBeVisible();
  });

  test("should display trust section with stats", async ({ page }) => {
    await expect(page.getByText("500+")).toBeVisible();
    await expect(page.getByText("Enterprise Customers")).toBeVisible();
    await expect(page.getByText("50M+")).toBeVisible();
    await expect(page.getByText("Stock Items Managed")).toBeVisible();
  });

  test("should display features section", async ({ page }) => {
    await expect(page.getByText("Zero-Trust Security")).toBeVisible();
    await expect(page.getByText("Real-time Synchronization")).toBeVisible();
    await expect(page.getByText("Multi-Tenant Architecture")).toBeVisible();
    await expect(page.getByText("Advanced Analytics")).toBeVisible();
  });

  test("should display footer with links", async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    await expect(page.getByText("Solutions")).toBeVisible();
    await expect(page.getByText("Platform")).toBeVisible();
    await expect(page.getByText("Resources")).toBeVisible();
    await expect(page.getByText("Company")).toBeVisible();
  });
});

test.describe("Navigation Dropdown", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should open Solutions dropdown and navigate", async ({ page }) => {
    // Hover over Solutions to open dropdown
    await page.getByRole("button", { name: "Solutions" }).hover();

    // Check dropdown items
    await expect(page.getByText("Stock Booking")).toBeVisible();
    await expect(page.getByText("ERP Integration")).toBeVisible();
    await expect(page.getByText("Analytics & Insights")).toBeVisible();
    await expect(page.getByText("Multi-Tenant")).toBeVisible();
  });

  test("should open Platform dropdown", async ({ page }) => {
    await page.getByRole("button", { name: "Platform" }).hover();

    await expect(page.getByText("Security")).toBeVisible();
    await expect(page.getByText("Integrations")).toBeVisible();
    await expect(page.getByText("API Documentation")).toBeVisible();
    await expect(page.getByText("Enterprise")).toBeVisible();
  });
});

test.describe("Mobile Navigation", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should open mobile menu", async ({ page }) => {
    await page.goto("/");

    // Click mobile menu button
    await page.getByRole("button", { name: /toggle menu/i }).click();

    // Check mobile menu items
    await expect(page.getByText("Solutions")).toBeVisible();
    await expect(page.getByText("Platform")).toBeVisible();
    await expect(page.getByText("Pricing")).toBeVisible();
  });
});

test.describe("Accessibility", () => {
  test("landing page should be accessible", async ({ page }) => {
    await page.goto("/");

    // Run accessibility checks (can integrate with axe-core)
    // For now, check basic a11y requirements

    // Check for proper heading hierarchy
    const h1 = await page.locator("h1").count();
    expect(h1).toBeGreaterThan(0);

    // Check all images have alt text (when images are added)
    const imagesWithoutAlt = await page.locator("img:not([alt])").count();
    expect(imagesWithoutAlt).toBe(0);

    // Check form labels (for search input)
    const inputs = await page.locator("input").all();
    for (const input of inputs) {
      const placeholder = await input.getAttribute("placeholder");
      expect(placeholder).toBeTruthy();
    }
  });
});
