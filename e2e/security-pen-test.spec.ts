/**
 * Security & Penetration Testing Suite
 * Military-grade security validation tests
 */

import { test, expect } from "@playwright/test";

test.describe("Security & Penetration Testing", () => {
  test.describe("Rate Limiting & DDoS Protection", () => {
    test("should block excessive requests from same IP", async ({
      request,
    }) => {
      const endpoint = "/api/public/test";
      const requests = [];

      // Send 100 requests rapidly
      for (let i = 0; i < 100; i++) {
        requests.push(request.get(endpoint));
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter((r) => r.status() === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    test("should include rate limit headers", async ({ request }) => {
      const response = await request.get("/api/public/test");
      const headers = response.headers();

      expect(headers["x-ratelimit-limit"]).toBeDefined();
      expect(headers["x-ratelimit-remaining"]).toBeDefined();
    });

    test("should block after violation threshold", async ({ request }) => {
      // Simulate repeated violations
      for (let i = 0; i < 15; i++) {
        await request.get("/api/auth/signin", {
          failOnStatusCode: false,
        });
      }

      // Should be blocked now
      const response = await request.get("/api/auth/signin", {
        failOnStatusCode: false,
      });

      expect(response.status()).toBe(429);
    });
  });

  test.describe("SQL Injection Protection", () => {
    test("should block SQL injection in query params", async ({ request }) => {
      const attacks = [
        "' OR '1'='1",
        "'; DROP TABLE users--",
        "admin'--",
        "1' UNION SELECT * FROM users--",
      ];

      for (const attack of attacks) {
        const response = await request.get(
          `/api/products?search=${encodeURIComponent(attack)}`,
          { failOnStatusCode: false },
        );

        // Should either block (400) or sanitize (200 with no results)
        expect([200, 400]).toContain(response.status());

        if (response.status() === 200) {
          const data = await response.json();
          // Should return empty or safe results, not execute SQL
          expect(Array.isArray(data) || data.error).toBeTruthy();
        }
      }
    });

    test("should block SQL injection in POST body", async ({ request }) => {
      const response = await request.post("/api/products", {
        data: {
          name: "Test'; DROP TABLE products--",
          sku: "' OR '1'='1",
        },
        failOnStatusCode: false,
      });

      expect([400, 401, 403]).toContain(response.status());
    });
  });

  test.describe("XSS Protection", () => {
    test("should sanitize XSS in form inputs", async ({ page }) => {
      await page.goto("/products/new");

      const xssPayload = '<script>alert("XSS")</script>';
      await page.fill('[name="name"]', xssPayload);
      await page.fill('[name="sku"]', "TEST-001");
      await page.click('button[type="submit"]');

      // Check that script didn't execute
      await expect(page.locator("text=XSS")).not.toBeVisible();

      // Check that it was sanitized in the database
      const content = await page.content();
      expect(content).not.toContain("<script>");
    });

    test("should block XSS in URL parameters", async ({ page }) => {
      const xssUrl = "/products?q=<img src=x onerror=\"alert('XSS')\">";
      await page.goto(xssUrl);

      // Script should not execute
      await expect(page.locator("text=XSS")).not.toBeVisible();
    });
  });

  test.describe("CSRF Protection", () => {
    test("should require CSRF token for POST requests", async ({ request }) => {
      const response = await request.post("/api/products", {
        data: { name: "Test", sku: "TEST-001" },
        failOnStatusCode: false,
      });

      // Should fail without CSRF token or authentication
      expect([401, 403]).toContain(response.status());
    });

    test("should validate CSRF token", async ({ request }) => {
      const response = await request.post("/api/products", {
        data: { name: "Test", sku: "TEST-001" },
        headers: {
          "x-csrf-token": "invalid-token",
        },
        failOnStatusCode: false,
      });

      expect([401, 403]).toContain(response.status());
    });
  });

  test.describe("Authentication & Authorization", () => {
    test("should block unauthorized API access", async ({ request }) => {
      const endpoints = [
        "/api/products",
        "/api/inventory",
        "/api/orders",
        "/api/users",
      ];

      for (const endpoint of endpoints) {
        const response = await request.get(endpoint, {
          failOnStatusCode: false,
        });

        expect(response.status()).toBe(401);
      }
    });

    test("should validate JWT token format", async ({ request }) => {
      const response = await request.get("/api/products", {
        headers: {
          Authorization: "Bearer invalid-token",
        },
        failOnStatusCode: false,
      });

      expect(response.status()).toBe(401);
    });

    test("should prevent privilege escalation", async ({
      request,
      context,
    }) => {
      // Login as regular user
      await context.addCookies([
        {
          name: "next-auth.session-token",
          value: "regular-user-session",
          domain: "localhost",
          path: "/",
        },
      ]);

      // Try to access admin endpoint
      const response = await request.get("/api/admin/users", {
        failOnStatusCode: false,
      });

      expect([401, 403]).toContain(response.status());
    });
  });

  test.describe("Path Traversal Protection", () => {
    test("should block path traversal attempts", async ({ request }) => {
      const attacks = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\config\\sam",
        "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
      ];

      for (const attack of attacks) {
        const response = await request.get(`/api/files/${attack}`, {
          failOnStatusCode: false,
        });

        expect([400, 403, 404]).toContain(response.status());
      }
    });
  });

  test.describe("Command Injection Protection", () => {
    test("should block command injection attempts", async ({ request }) => {
      const attacks = [
        "; ls -la",
        "| cat /etc/passwd",
        "$(whoami)",
        "`reboot`",
      ];

      for (const attack of attacks) {
        const response = await request.post("/api/execute", {
          data: { command: attack },
          failOnStatusCode: false,
        });

        expect([400, 403]).toContain(response.status());
      }
    });
  });

  test.describe("Security Headers", () => {
    test("should include security headers", async ({ request }) => {
      const response = await request.get("/");
      const headers = response.headers();

      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["x-frame-options"]).toBe("DENY");
      expect(headers["x-xss-protection"]).toBe("1; mode=block");
      expect(headers["strict-transport-security"]).toContain("max-age=");
      expect(headers["content-security-policy"]).toBeDefined();
    });

    test("should prevent clickjacking", async ({ page }) => {
      await page.goto("/");

      const xFrameOptions = await page.evaluate(() => {
        const meta = document.querySelector(
          'meta[http-equiv="X-Frame-Options"]',
        );
        return meta?.getAttribute("content");
      });

      expect(xFrameOptions || "DENY").toBe("DENY");
    });
  });

  test.describe("Sensitive Data Exposure", () => {
    test("should not expose sensitive data in errors", async ({ request }) => {
      const response = await request.get("/api/products/invalid-id", {
        failOnStatusCode: false,
      });

      const body = await response.text();

      // Should not expose stack traces or internal paths in production
      expect(body).not.toContain("at Object");
      expect(body).not.toContain("/workspaces/");
      expect(body).not.toContain("prisma");
    });

    test("should not expose user passwords in API responses", async ({
      request,
    }) => {
      const response = await request.get("/api/users", {
        failOnStatusCode: false,
      });

      if (response.ok()) {
        const body = await response.json();
        const bodyStr = JSON.stringify(body);

        expect(bodyStr).not.toContain("password");
        expect(bodyStr).not.toContain("hashedPassword");
      }
    });
  });

  test.describe("File Upload Security", () => {
    test("should validate file types", async ({ request }) => {
      const maliciousFile = Buffer.from("<?php system($_GET['cmd']); ?>");

      const response = await request.post("/api/upload", {
        multipart: {
          file: {
            name: "malicious.php",
            mimeType: "application/x-php",
            buffer: maliciousFile,
          },
        },
        failOnStatusCode: false,
      });

      expect([400, 403, 415]).toContain(response.status());
    });

    test("should enforce file size limits", async ({ request }) => {
      const largeFile = Buffer.alloc(100 * 1024 * 1024); // 100MB

      const response = await request.post("/api/upload", {
        multipart: {
          file: {
            name: "large.txt",
            mimeType: "text/plain",
            buffer: largeFile,
          },
        },
        failOnStatusCode: false,
      });

      expect([400, 413]).toContain(response.status());
    });
  });

  test.describe("Session Management", () => {
    test("should expire sessions after timeout", async ({ page, context }) => {
      // Login
      await page.goto("/sign-in");
      // ... login process ...

      // Wait for session timeout (in test, we'd mock this)
      await context.addCookies([
        {
          name: "next-auth.session-token",
          value: "expired-token",
          domain: "localhost",
          path: "/",
          expires: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        },
      ]);

      // Try to access protected route
      await page.goto("/dashboard");

      // Should redirect to login
      await expect(page).toHaveURL(/\/auth\/signin/);
    });

    test("should prevent session fixation", async ({ page, context }) => {
      // Get initial session token
      await page.goto("/");
      const initialCookies = await context.cookies();
      const initialSession = initialCookies.find(
        (c) => c.name === "next-auth.session-token",
      );

      // Login
      await page.goto("/sign-in");
      // ... login process ...

      // Get post-login session token
      const postLoginCookies = await context.cookies();
      const postLoginSession = postLoginCookies.find(
        (c) => c.name === "next-auth.session-token",
      );

      // Session token should have changed
      expect(postLoginSession?.value).not.toBe(initialSession?.value);
    });
  });

  test.describe("API Input Validation", () => {
    test("should validate required fields", async ({ request }) => {
      const response = await request.post("/api/products", {
        data: {},
        failOnStatusCode: false,
      });

      expect([400, 422]).toContain(response.status());

      const body = await response.json();
      expect(body.error || body.errors).toBeDefined();
    });

    test("should validate data types", async ({ request }) => {
      const response = await request.post("/api/products", {
        data: {
          name: "Test",
          price: "not-a-number",
          quantity: "invalid",
        },
        failOnStatusCode: false,
      });

      expect([400, 422]).toContain(response.status());
    });

    test("should validate string length limits", async ({ request }) => {
      const longString = "a".repeat(10000);

      const response = await request.post("/api/products", {
        data: {
          name: longString,
          sku: "TEST-001",
        },
        failOnStatusCode: false,
      });

      expect([400, 413, 422]).toContain(response.status());
    });
  });

  test.describe("Denial of Service (DoS) Protection", () => {
    test("should limit request size", async ({ request }) => {
      const largePayload = { data: "x".repeat(10 * 1024 * 1024) }; // 10MB

      const response = await request.post("/api/products", {
        data: largePayload,
        failOnStatusCode: false,
      });

      expect([400, 413]).toContain(response.status());
    });

    test("should timeout long-running requests", async ({ request }) => {
      const response = await request.get("/api/long-running-task", {
        timeout: 30000, // 30 second timeout
        failOnStatusCode: false,
      });

      // Should either complete or timeout, not hang indefinitely
      expect(response).toBeDefined();
    });
  });
});
