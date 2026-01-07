# Testing Guide

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Running Tests](#running-tests)
3. [Unit Tests](#unit-tests)
4. [Integration Tests](#integration-tests)
5. [E2E Tests](#e2e-tests)
6. [Test Coverage](#test-coverage)
7. [Writing Tests](#writing-tests)
8. [CI/CD Testing](#cicd-testing)

---

## Testing Strategy

### Test Pyramid

```
        /\
       /  \      E2E Tests (10%)
      /____\     - Critical user flows
     /      \    - Smoke tests
    /________\   Integration Tests (30%)
   /          \  - API endpoints
  /____________\ - Service integration
 /______________\ Unit Tests (60%)
                  - Business logic
                  - Utilities
                  - Components
```

### Test Types

| Type            | Purpose                              | Tools            | Speed            | Coverage     |
| --------------- | ------------------------------------ | ---------------- | ---------------- | ------------ |
| **Unit**        | Test individual functions/components | Jest             | Fast (ms)        | 60% of tests |
| **Integration** | Test API endpoints and services      | Jest + Supertest | Medium (seconds) | 30% of tests |
| **E2E**         | Test complete user workflows         | Playwright       | Slow (minutes)   | 10% of tests |
| **Manual**      | Exploratory testing                  | Human QA         | Variable         | As needed    |

---

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test auth.test.ts

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

### Environment Setup

```bash
# 1. Copy test environment file
cp .env.test.example .env.test

# 2. Start test database
docker-compose -f docker-compose.test.yml up -d

# 3. Run migrations
DATABASE_URL="postgresql://test:test@localhost:5433/test_db" \
  npx prisma migrate deploy

# 4. Run tests
npm test
```

### Test Database

Tests use an isolated test database:

```env
# .env.test
DATABASE_URL="postgresql://test:test@localhost:5433/test_db"
NODE_ENV="test"
NEXTAUTH_SECRET="test-secret"
```

---

## Unit Tests

### Overview

Unit tests focus on individual functions, classes, and components in isolation.

### Example: Testing a Service

```typescript
// lib/services/__tests__/email-service.test.ts
import { describe, expect, test, jest, beforeEach } from "@jest/globals";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../email-service";
import * as sgMail from "@sendgrid/mail";

// Mock SendGrid
jest.mock("@sendgrid/mail");

describe("Email Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SENDGRID_API_KEY = "test-key";
    process.env.SENDGRID_FROM_EMAIL = "test@example.com";
  });

  describe("sendWelcomeEmail", () => {
    test("should send welcome email with correct content", async () => {
      const mockSend = jest
        .spyOn(sgMail, "send")
        .mockResolvedValue([{ statusCode: 202, body: "", headers: {} }, {}]);

      await sendWelcomeEmail({
        to: "user@example.com",
        userName: "John Doe",
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: expect.stringContaining("Welcome"),
        }),
      );
    });

    test("should handle send failures gracefully", async () => {
      jest.spyOn(sgMail, "send").mockRejectedValue(new Error("Send failed"));

      const result = await sendWelcomeEmail({
        to: "user@example.com",
        userName: "John Doe",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
```

### Example: Testing a Utility Function

```typescript
// lib/utils/__tests__/format.test.ts
import { describe, expect, test } from "@jest/globals";
import { formatCurrency, formatDate, truncateString } from "../format";

describe("Format Utilities", () => {
  describe("formatCurrency", () => {
    test("should format USD correctly", () => {
      expect(formatCurrency(1234.56, "USD")).toBe("$1,234.56");
    });

    test("should handle zero", () => {
      expect(formatCurrency(0, "USD")).toBe("$0.00");
    });

    test("should handle negative numbers", () => {
      expect(formatCurrency(-100, "USD")).toBe("-$100.00");
    });
  });

  describe("formatDate", () => {
    test("should format date correctly", () => {
      const date = new Date("2026-01-02T12:00:00Z");
      expect(formatDate(date, "MM/DD/YYYY")).toBe("01/02/2026");
    });
  });

  describe("truncateString", () => {
    test("should truncate long strings", () => {
      const long = "This is a very long string that needs truncation";
      expect(truncateString(long, 20)).toBe("This is a very long...");
    });

    test("should not truncate short strings", () => {
      expect(truncateString("Short", 20)).toBe("Short");
    });
  });
});
```

### Example: Testing React Components

```typescript
// components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, jest } from '@jest/globals';
import Button from '../Button';

describe('Button Component', () => {
  test('should render with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  test('should call onClick handler', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeDisabled();
  });

  test('should apply variant styles', () => {
    const { container } = render(<Button variant="primary">Click Me</Button>);
    expect(container.firstChild).toHaveClass('btn-primary');
  });
});
```

---

## Integration Tests

### Overview

Integration tests verify that multiple components work together correctly, particularly API endpoints and database interactions.

### Example: Testing API Routes

```typescript
// __tests__/api/carriers.test.ts
import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import { createMocks } from "node-mocks-http";
import { GET, POST } from "@/app/api/carriers/route";
import { prisma } from "@/lib/prisma";

describe("/api/carriers", () => {
  let testOrg: any;
  let testUser: any;

  beforeAll(async () => {
    // Setup test data
    testOrg = await prisma.organization.create({
      data: {
        name: `Test Org ${Date.now()}`,
        slug: `test-org-${Date.now()}`,
      },
    });

    testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: "Test User",
        password: "hashed",
        organizationId: testOrg.id,
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.organization.delete({ where: { id: testOrg.id } });
    await prisma.$disconnect();
  });

  describe("GET /api/carriers", () => {
    test("should return carriers for organization", async () => {
      const { req, res } = createMocks({
        method: "GET",
        headers: {
          "x-organization-id": testOrg.id,
          "x-user-id": testUser.id,
        },
      });

      await GET(req as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.carriers).toBeDefined();
      expect(Array.isArray(data.carriers)).toBe(true);
    });

    test("should filter carriers by type", async () => {
      const { req } = createMocks({
        method: "GET",
        query: { type: "PARCEL" },
        headers: {
          "x-organization-id": testOrg.id,
          "x-user-id": testUser.id,
        },
      });

      await GET(req as any);
      // Verify filtering logic
    });
  });

  describe("POST /api/carriers", () => {
    test("should create a new carrier", async () => {
      const { req } = createMocks({
        method: "POST",
        body: {
          name: "Test Carrier",
          code: `TC-${Date.now()}`,
          type: "PARCEL",
          isActive: true,
        },
        headers: {
          "x-organization-id": testOrg.id,
          "x-user-id": testUser.id,
        },
      });

      await POST(req as any);
      // Verify carrier created
    });

    test("should validate required fields", async () => {
      const { req } = createMocks({
        method: "POST",
        body: {}, // Missing required fields
        headers: {
          "x-organization-id": testOrg.id,
          "x-user-id": testUser.id,
        },
      });

      const response = await POST(req as any);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });
});
```

---

## E2E Tests

### Overview

End-to-end tests simulate real user interactions with the application using Playwright.

### Example: Login Flow

```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should login successfully", async ({ page }) => {
    await page.goto("/login");

    // Fill in login form
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator(".error-message")).toBeVisible();
    await expect(page.locator(".error-message")).toContainText(
      "Invalid credentials",
    );
  });

  test("should support MFA login", async ({ page }) => {
    await page.goto("/login");

    // Login with credentials
    await page.fill('input[name="email"]', "mfa-user@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Should show MFA prompt
    await expect(page.locator('input[name="mfaCode"]')).toBeVisible();

    // Enter MFA code
    await page.fill('input[name="mfaCode"]', "123456");
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");
  });
});
```

### Example: Order Creation Flow

```typescript
// e2e/orders.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Order Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("should create a new order", async ({ page }) => {
    // Navigate to orders
    await page.click('a[href="/dashboard/orders"]');
    await expect(page).toHaveURL("/dashboard/orders");

    // Click create order button
    await page.click('button:has-text("Create Order")');

    // Fill in order form
    await page.selectOption('select[name="customerId"]', { index: 1 });
    await page.selectOption('select[name="warehouseId"]', { index: 1 });
    await page.click('button:has-text("Add Item")');
    await page.selectOption('select[name="items[0].itemId"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', "5");

    // Submit form
    await page.click('button[type="submit"]:has-text("Create Order")');

    // Should show success message
    await expect(page.locator(".toast-success")).toBeVisible();
    await expect(page.locator(".toast-success")).toContainText(
      "Order created successfully",
    );

    // Should redirect to order detail
    await expect(page).toHaveURL(/\/dashboard\/orders\/ORD-/);
  });

  test("should display order list", async ({ page }) => {
    await page.goto("/dashboard/orders");

    // Should show orders table
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator('th:has-text("Order Number")')).toBeVisible();
    await expect(page.locator('th:has-text("Customer")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  test("should filter orders by status", async ({ page }) => {
    await page.goto("/dashboard/orders");

    // Select status filter
    await page.selectOption('select[name="status"]', "PENDING");

    // Table should update
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/orders") && response.status() === 200,
    );

    // All visible orders should have PENDING status
    const statusCells = await page.locator("td[data-status]").all();
    for (const cell of statusCells) {
      await expect(cell).toContainText("PENDING");
    }
  });
});
```

---

## Test Coverage

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage Thresholds

```javascript
// jest.config.js
module.exports = {
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Coverage Goals

- **Unit Tests:** 80%+ coverage
- **Integration Tests:** 70%+ coverage
- **Critical Paths:** 100% coverage
  - Authentication
  - Payment processing
  - Order fulfillment
  - Inventory management

---

## Writing Tests

### Best Practices

**1. Follow AAA Pattern:**

```typescript
test("should do something", () => {
  // Arrange: Setup test data
  const input = { name: "Test" };

  // Act: Execute the function
  const result = processInput(input);

  // Assert: Verify the result
  expect(result).toBe("Test processed");
});
```

**2. Use Descriptive Test Names:**

```typescript
// ❌ Bad
test('test 1', () => { ... });

// ✅ Good
test('should return user when valid ID is provided', () => { ... });
```

**3. Test One Thing at a Time:**

```typescript
// ❌ Bad - Testing multiple things
test("user operations", () => {
  createUser();
  updateUser();
  deleteUser();
});

// ✅ Good - Separate tests
test("should create user", () => {
  createUser();
});
test("should update user", () => {
  updateUser();
});
test("should delete user", () => {
  deleteUser();
});
```

**4. Use Test Fixtures:**

```typescript
// __tests__/fixtures/users.ts
export const mockUser = {
  id: "123",
  email: "test@example.com",
  name: "Test User",
};

// In test file
import { mockUser } from "./fixtures/users";
```

**5. Mock External Dependencies:**

```typescript
// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));
```

---

## CI/CD Testing

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
```

### Test Stages

1. **Lint:** Code style and TypeScript checks
2. **Unit Tests:** Fast tests running in parallel
3. **Integration Tests:** API and service tests
4. **E2E Tests:** Critical user flows
5. **Coverage Report:** Upload to Codecov

---

## Troubleshooting

### Common Issues

**Tests timeout:**

```typescript
// Increase timeout for slow tests
test("slow operation", async () => {
  // ...
}, 10000); // 10 seconds
```

**Database connection errors:**

```bash
# Ensure test database is running
docker-compose -f docker-compose.test.yml up -d

# Check connection
psql postgresql://test:test@localhost:5433/test_db
```

**Flaky tests:**

```typescript
// Use waitFor for async operations
import { waitFor } from "@testing-library/react";

test("async test", async () => {
  await waitFor(() => {
    expect(screen.getByText("Loaded")).toBeInTheDocument();
  });
});
```

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Test Doubles (Mocks, Stubs, Spies)](https://martinfowler.com/articles/mocksArentStubs.html)

---

**Document Version:** 1.0  
**Last Updated:** January 2, 2026  
**Owner:** Engineering Team
