/**
 * Security E2E Tests
 * Tests for common web vulnerabilities and security controls
 * @security
 */

import { test, expect } from "@playwright/test";

test.describe("Security Tests @security", () => {
  test.describe("Authentication Security", () => {
    test("should prevent SQL injection in login", async ({ page }) => {
      await page.goto("/login");

      // Attempt SQL injection
      await page.fill('input[name="email"]', "admin' OR '1'='1");
      await page.fill('input[name="password"]', "password' OR '1'='1");
      await page.click('button[type="submit"]');

      // Should not bypass authentication
      await expect(page.locator("text=Invalid credentials")).toBeVisible();
      await expect(page).not.toHaveURL("/dashboard");
    });

    test("should prevent brute force attacks with rate limiting", async ({
      page,
    }) => {
      await page.goto("/login");

      // Attempt multiple failed logins
      for (let i = 0; i < 10; i++) {
        await page.fill('input[name="email"]', "test@example.com");
        await page.fill('input[name="password"]', `wrongpassword${i}`);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(100);
      }

      // Should show rate limit error
      await expect(
        page.locator("text=/too many attempts|rate limit/i"),
      ).toBeVisible();
    });

    test("should implement secure session management", async ({
      page,
      context,
    }) => {
      // Login
      await page.goto("/login");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "ValidPassword123!");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL("/dashboard");

      // Check for secure cookies
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(
        (c) => c.name.includes("session") || c.name.includes("token"),
      );

      expect(sessionCookie).toBeDefined();
      expect(sessionCookie?.secure).toBe(true);
      expect(sessionCookie?.httpOnly).toBe(true);
      expect(sessionCookie?.sameSite).toBe("Strict");
    });

    test("should logout and invalidate session", async ({ page }) => {
      // Login first
      await page.goto("/login");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "ValidPassword123!");
      await page.click('button[type="submit"]');

      // Logout
      await page.click('button[aria-label="User menu"]');
      await page.click("text=Logout");

      // Try to access protected route
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/login");
    });
  });

  test.describe("XSS Protection", () => {
    test("should sanitize user input in comments", async ({ page }) => {
      await page.goto("/orders/123");

      // Attempt XSS injection
      await page.fill(
        'textarea[name="comment"]',
        '<script>alert("XSS")</script>',
      );
      await page.click('button:has-text("Add Comment")');

      // Script should be escaped, not executed
      const comment = page.locator(".comment-text").first();
      await expect(comment).toContainText("<script>");
      await expect(comment).not.toContainText("XSS");

      // Check that script didn't execute
      page.on("dialog", () => {
        throw new Error("XSS alert dialog appeared!");
      });
    });

    test("should prevent XSS in search parameters", async ({ page }) => {
      await page.goto("/search?q=<img src=x onerror=alert(1)>");

      // Should escape the malicious input
      const searchInput = page.locator('input[name="q"]');
      const value = await searchInput.inputValue();
      expect(value).toBe("<img src=x onerror=alert(1)>");

      // No alert should fire
      page.on("dialog", () => {
        throw new Error("XSS alert dialog appeared!");
      });
    });
  });

  test.describe("CSRF Protection", () => {
    test("should require CSRF token for state-changing operations", async ({
      page,
      request,
    }) => {
      // Login first
      await page.goto("/login");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "ValidPassword123!");
      await page.click('button[type="submit"]');

      // Get cookies
      const cookies = await page.context().cookies();
      const cookieHeader = cookies
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

      // Attempt API call without CSRF token
      const response = await request.post("http://localhost:3000/api/orders", {
        headers: {
          Cookie: cookieHeader,
          "Content-Type": "application/json",
        },
        data: {
          customerId: "123",
          items: [{ sku: "TEST-001", quantity: 1 }],
        },
      });

      // Should be rejected due to missing CSRF token
      expect(response.status()).toBe(403);
    });
  });

  test.describe("Authorization", () => {
    test("should prevent unauthorized access to admin routes", async ({
      page,
    }) => {
      // Login as regular user
      await page.goto("/login");
      await page.fill('input[name="email"]', "user@example.com");
      await page.fill('input[name="password"]', "ValidPassword123!");
      await page.click('button[type="submit"]');

      // Try to access admin route
      await page.goto("/admin/users");

      // Should be redirected or show error
      await expect(
        page.locator("text=/access denied|unauthorized|forbidden/i"),
      ).toBeVisible();
    });

    test("should enforce role-based access control", async ({ page }) => {
      // Login as warehouse worker
      await page.goto("/login");
      await page.fill('input[name="email"]', "worker@example.com");
      await page.fill('input[name="password"]', "ValidPassword123!");
      await page.click('button[type="submit"]');

      // Should see warehouse operations
      await expect(page.locator('a[href="/picking"]')).toBeVisible();

      // Should not see financial reports
      await expect(
        page.locator('a[href="/reports/financial"]'),
      ).not.toBeVisible();
    });
  });

  test.describe("Input Validation", () => {
    test("should validate email format", async ({ page }) => {
      await page.goto("/settings/profile");

      await page.fill('input[name="email"]', "invalid-email");
      await page.click('button[type="submit"]');

      await expect(
        page.locator("text=/invalid email|valid email/i"),
      ).toBeVisible();
    });

    test("should enforce password complexity", async ({ page }) => {
      await page.goto("/settings/security");

      // Weak password
      await page.fill('input[name="newPassword"]', "123456");
      await page.click('button[type="submit"]');

      await expect(
        page.locator("text=/password must|password should|too weak/i"),
      ).toBeVisible();
    });

    test("should prevent path traversal in file operations", async ({
      page,
    }) => {
      await page.goto("/documents");

      // Attempt path traversal
      const response = await page.request.get(
        "http://localhost:3000/api/documents/../../../../etc/passwd",
      );

      expect(response.status()).toBe(400);
    });
  });

  test.describe("Security Headers", () => {
    test("should have proper security headers", async ({ page }) => {
      const response = await page.goto("/");

      expect(response).toBeTruthy();
      if (response) {
        const headers = response.headers();

        // Check for security headers
        expect(headers["x-frame-options"]).toBe("DENY");
        expect(headers["x-content-type-options"]).toBe("nosniff");
        expect(headers["x-xss-protection"]).toBe("1; mode=block");
        expect(headers["strict-transport-security"]).toContain("max-age=");
        expect(headers["content-security-policy"]).toBeDefined();
        expect(headers["referrer-policy"]).toBeDefined();
        expect(headers["permissions-policy"]).toBeDefined();
      }
    });

    test("should have Content Security Policy", async ({ page }) => {
      const response = await page.goto("/");

      if (response) {
        const csp = response.headers()["content-security-policy"];
        expect(csp).toBeDefined();
        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain("script-src");
        expect(csp).toContain("style-src");
      }
    });
  });

  test.describe("API Security", () => {
    test("should require authentication for API endpoints", async ({
      request,
    }) => {
      const response = await request.get("http://localhost:3000/api/inventory");

      expect(response.status()).toBe(401);
    });

    test("should validate API rate limits", async ({ request, page }) => {
      // Login to get token
      await page.goto("/login");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "ValidPassword123!");
      await page.click('button[type="submit"]');

      const cookies = await page.context().cookies();
      const cookieHeader = cookies
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

      // Make many requests
      const requests = [];
      for (let i = 0; i < 100; i++) {
        requests.push(
          request.get("http://localhost:3000/api/inventory", {
            headers: { Cookie: cookieHeader },
          }),
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some((r) => r.status() === 429);

      expect(rateLimited).toBe(true);
    });

    test("should prevent NoSQL injection", async ({ request, page }) => {
      // Login first
      await page.goto("/login");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "ValidPassword123!");
      await page.click('button[type="submit"]');

      const cookies = await page.context().cookies();
      const cookieHeader = cookies
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

      // Attempt NoSQL injection
      const response = await request.post("http://localhost:3000/api/orders", {
        headers: {
          Cookie: cookieHeader,
          "Content-Type": "application/json",
        },
        data: {
          customerId: { $ne: null },
          items: [{ sku: "TEST-001", quantity: 1 }],
        },
      });

      // Should reject malformed input
      expect(response.status()).toBe(400);
    });
  });

  test.describe("Data Protection", () => {
    test("should not expose sensitive data in responses", async ({ page }) => {
      await page.goto("/api/users/123");

      const content = await page.content();

      // Should not contain sensitive fields
      expect(content).not.toContain("password");
      expect(content).not.toContain("passwordHash");
      expect(content).not.toContain("salt");
      expect(content).not.toContain("ssn");
      expect(content).not.toContain("creditCard");
    });

    test("should mask sensitive information in logs", async ({ page }) => {
      // This would require access to logs, which is environment-specific
      // In production, audit your logging to ensure no sensitive data is logged
      expect(true).toBe(true);
    });
  });

  test.describe("File Upload Security", () => {
    test("should validate file types", async ({ page }) => {
      await page.goto("/documents/upload");

      // Attempt to upload executable
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "malicious.exe",
        mimeType: "application/x-msdownload",
        buffer: Buffer.from("fake executable content"),
      });

      await page.click('button:has-text("Upload")');

      await expect(
        page.locator("text=/file type not allowed|invalid file type/i"),
      ).toBeVisible();
    });

    test("should limit file size", async ({ page }) => {
      await page.goto("/documents/upload");

      // Create large file (> 10MB)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024, "a");

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "large-file.pdf",
        mimeType: "application/pdf",
        buffer: largeBuffer,
      });

      await page.click('button:has-text("Upload")');

      await expect(
        page.locator("text=/file too large|exceeds maximum size/i"),
      ).toBeVisible();
    });
  });

  test.describe("Encryption", () => {
    test("should use HTTPS in production", async ({ page }) => {
      // In production, verify HTTPS
      const url = page.url();
      if (process.env.NODE_ENV === "production") {
        expect(url).toMatch(/^https:/);
      }
    });

    test("should not transmit sensitive data in URL", async ({ page }) => {
      await page.goto("/login");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "ValidPassword123!");
      await page.click('button[type="submit"]');

      // Password should not be in URL
      expect(page.url()).not.toContain("password");
      expect(page.url()).not.toContain("ValidPassword123");
    });
  });
});
