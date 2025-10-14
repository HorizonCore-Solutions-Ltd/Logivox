# FlowStock Testing Strategy & Guidelines

## Testing Philosophy

FlowStock follows a comprehensive testing approach to ensure reliability, security, and performance across all components. Our testing strategy emphasizes:

1. **Multi-tenant Isolation**: Every test must verify organization-level data separation
2. **Mobile-first Testing**: UI tests prioritize mobile device compatibility
3. **Real-time Verification**: WebSocket and live update functionality testing
4. **Security Validation**: Authentication and authorization testing at all levels
5. **Performance Assurance**: Load testing for warehouse-scale operations

## Testing Pyramid

### Unit Tests (70%)
- **Purpose**: Test individual functions, utilities, and business logic
- **Tools**: Jest, Vitest
- **Focus**: Pure functions, validators, utilities, business rules
- **Coverage Target**: 90%+ for critical business logic

### Integration Tests (20%)
- **Purpose**: Test API endpoints, database operations, and service interactions
- **Tools**: Jest, Supertest, Prisma Test Environment
- **Focus**: API routes, database queries, external service integrations
- **Coverage Target**: 80%+ for all API endpoints

### End-to-End Tests (10%)
- **Purpose**: Test complete user workflows and critical business processes
- **Tools**: Playwright, Cypress
- **Focus**: User journeys, cross-browser compatibility, mobile responsiveness
- **Coverage Target**: 100% of critical user paths

## Frontend Testing Standards

### Component Testing
```typescript
// Example: InventoryList component test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import InventoryList from '../components/InventoryList';

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('InventoryList', () => {
  beforeEach(() => {
    // Mock API responses
    jest.spyOn(global, 'fetch').mockImplementation(mockFetch);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('displays inventory items for current organization only', async () => {
    const mockUser = { organizationId: 'org-123', role: 'admin' };
    
    render(
      <InventoryList warehouseId="wh-456" />,
      { wrapper: createTestWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Widget A')).toBeInTheDocument();
      expect(screen.getByText('Widget B')).toBeInTheDocument();
    });

    // Verify API was called with correct organization filter
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('organizationId=org-123')
    );
  });

  test('handles mobile touch interactions', async () => {
    const onItemSelect = jest.fn();
    
    render(
      <InventoryList warehouseId="wh-456" onItemSelect={onItemSelect} />,
      { wrapper: createTestWrapper() }
    );

    // Simulate touch interaction
    const itemCard = await screen.findByTestId('inventory-item-1');
    fireEvent.touchStart(itemCard);
    fireEvent.touchEnd(itemCard);

    expect(onItemSelect).toHaveBeenCalled();
  });

  test('works offline with cached data', async () => {
    // Mock offline scenario
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    render(
      <InventoryList warehouseId="wh-456" />,
      { wrapper: createTestWrapper() }
    );

    // Should display cached data
    await waitFor(() => {
      expect(screen.getByText('Offline Mode')).toBeInTheDocument();
      expect(screen.getByText('Cached Widget A')).toBeInTheDocument();
    });
  });
});
```

### Mobile Testing Standards
```typescript
// Mobile-specific testing utilities
export const mobileTestUtils = {
  // Simulate mobile viewport
  setMobileViewport: () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667
    });
  },

  // Simulate touch events
  simulateTouch: (element: HTMLElement) => {
    fireEvent.touchStart(element, {
      touches: [{ clientX: 100, clientY: 100 }]
    });
    fireEvent.touchEnd(element);
  },

  // Test barcode scanner integration
  mockBarcodeScanner: () => {
    const mockGetUserMedia = jest.fn().mockResolvedValue({
      getVideoTracks: () => [{ stop: jest.fn() }]
    });
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia }
    });
  }
};
```

### Real-time Testing
```typescript
// WebSocket testing utilities
import { io as Client } from 'socket.io-client';
import { createServer } from 'http';
import { Server } from 'socket.io';

describe('Real-time Inventory Updates', () => {
  let server: any;
  let io: Server;
  let clientSocket: any;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    
    httpServer.listen(() => {
      const port = (httpServer.address() as any).port;
      clientSocket = Client(`http://localhost:${port}`, {
        auth: { organizationId: 'org-123' }
      });
      
      io.on('connection', (socket) => {
        // Join organization room
        socket.join(`org-${socket.handshake.auth.organizationId}`);
      });
      
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  test('receives inventory updates for same organization only', (done) => {
    clientSocket.on('inventory:updated', (data: any) => {
      expect(data.organizationId).toBe('org-123');
      expect(data.item.id).toBe('item-456');
      done();
    });

    // Simulate inventory update
    io.to('org-org-123').emit('inventory:updated', {
      organizationId: 'org-123',
      item: { id: 'item-456', name: 'Updated Widget' }
    });
  });
});
```

## Backend Testing Standards

### API Integration Testing
```typescript
// Example: Inventory API integration test
import request from 'supertest';
import { app } from '../src/index';
import { prisma } from '../src/db';
import { generateTestToken } from '../src/utils/testHelpers';

describe('Inventory API', () => {
  let authToken: string;
  let testOrganization: any;
  let testUser: any;

  beforeAll(async () => {
    // Set up test organization and user
    testOrganization = await prisma.organization.create({
      data: { name: 'Test Org', domain: 'test.com' }
    });

    testUser = await prisma.user.create({
      data: {
        email: 'test@test.com',
        name: 'Test User',
        organizationId: testOrganization.id,
        role: 'ADMIN'
      }
    });

    authToken = generateTestToken(testUser);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.organization.delete({ where: { id: testOrganization.id } });
  });

  describe('GET /api/inventory', () => {
    test('returns inventory for authenticated user organization only', async () => {
      // Create test inventory items
      const item1 = await prisma.inventoryItem.create({
        data: {
          name: 'Test Widget A',
          sku: 'TWA-001',
          organizationId: testOrganization.id,
          warehouseId: 'wh-test'
        }
      });

      // Create item in different organization (should not be returned)
      const otherOrg = await prisma.organization.create({
        data: { name: 'Other Org', domain: 'other.com' }
      });

      await prisma.inventoryItem.create({
        data: {
          name: 'Other Widget',
          sku: 'OW-001',
          organizationId: otherOrg.id,
          warehouseId: 'wh-other'
        }
      });

      const response = await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Test Widget A');
      expect(response.body.data[0].organizationId).toBe(testOrganization.id);

      // Clean up
      await prisma.inventoryItem.delete({ where: { id: item1.id } });
      await prisma.organization.delete({ where: { id: otherOrg.id } });
    });

    test('requires authentication', async () => {
      await request(app)
        .get('/api/inventory')
        .expect(401);
    });

    test('requires inventory:read permission', async () => {
      const limitedUser = await prisma.user.create({
        data: {
          email: 'limited@test.com',
          name: 'Limited User',
          organizationId: testOrganization.id,
          role: 'VIEWER'
        }
      });

      const limitedToken = generateTestToken(limitedUser);

      await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${limitedToken}`)
        .expect(403);

      await prisma.user.delete({ where: { id: limitedUser.id } });
    });
  });

  describe('POST /api/inventory', () => {
    test('creates inventory item with organization isolation', async () => {
      const newItem = {
        name: 'New Test Widget',
        sku: 'NTW-001',
        warehouseId: 'wh-test',
        currentStock: 100,
        minimumStock: 10,
        unitPrice: 25.99
      };

      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newItem)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newItem.name);
      expect(response.body.data.organizationId).toBe(testOrganization.id);

      // Verify in database
      const created = await prisma.inventoryItem.findUnique({
        where: { id: response.body.data.id }
      });
      
      expect(created).not.toBeNull();
      expect(created!.organizationId).toBe(testOrganization.id);

      // Clean up
      await prisma.inventoryItem.delete({ where: { id: created!.id } });
    });

    test('validates required fields', async () => {
      const invalidItem = {
        name: '', // Invalid: empty name
        sku: 'INVALID'
      };

      await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidItem)
        .expect(400);
    });
  });
});
```

### Database Testing
```typescript
// Database operation testing
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

describe('Database Operations', () => {
  beforeEach(async () => {
    // Reset database to clean state
    execSync('npx prisma migrate reset --force --skip-generate', {
      env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('enforces multi-tenant data isolation', async () => {
    const org1 = await prisma.organization.create({
      data: { name: 'Org 1', domain: 'org1.com' }
    });

    const org2 = await prisma.organization.create({
      data: { name: 'Org 2', domain: 'org2.com' }
    });

    // Create inventory items for each organization
    await prisma.inventoryItem.createMany({
      data: [
        { name: 'Item 1', sku: 'I1', organizationId: org1.id, warehouseId: 'wh1' },
        { name: 'Item 2', sku: 'I2', organizationId: org2.id, warehouseId: 'wh2' }
      ]
    });

    // Query should only return items for specific organization
    const org1Items = await prisma.inventoryItem.findMany({
      where: { organizationId: org1.id }
    });

    const org2Items = await prisma.inventoryItem.findMany({
      where: { organizationId: org2.id }
    });

    expect(org1Items).toHaveLength(1);
    expect(org2Items).toHaveLength(1);
    expect(org1Items[0].name).toBe('Item 1');
    expect(org2Items[0].name).toBe('Item 2');
  });

  test('maintains referential integrity', async () => {
    const org = await prisma.organization.create({
      data: { name: 'Test Org', domain: 'test.com' }
    });

    const warehouse = await prisma.warehouse.create({
      data: {
        name: 'Test Warehouse',
        address: '123 Test St',
        organizationId: org.id
      }
    });

    // Should not be able to create inventory item with invalid warehouse
    await expect(
      prisma.inventoryItem.create({
        data: {
          name: 'Test Item',
          sku: 'TI-001',
          organizationId: org.id,
          warehouseId: 'invalid-warehouse-id'
        }
      })
    ).rejects.toThrow();

    // Should work with valid warehouse
    const item = await prisma.inventoryItem.create({
      data: {
        name: 'Test Item',
        sku: 'TI-001',
        organizationId: org.id,
        warehouseId: warehouse.id
      }
    });

    expect(item.warehouseId).toBe(warehouse.id);
  });
});
```

## End-to-End Testing

### Critical User Workflows
```typescript
// Playwright E2E tests
import { test, expect } from '@playwright/test';

test.describe('Warehouse Stock Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as warehouse manager
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'manager@flowstock.io');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('complete stock booking workflow', async ({ page }) => {
    // Navigate to inventory
    await page.click('[data-testid="nav-inventory"]');
    await expect(page).toHaveURL('/inventory');

    // Add new inventory item
    await page.click('[data-testid="add-inventory-button"]');
    await page.fill('[data-testid="item-name"]', 'Test Widget');
    await page.fill('[data-testid="item-sku"]', 'TW-001');
    await page.fill('[data-testid="current-stock"]', '100');
    await page.fill('[data-testid="minimum-stock"]', '10');
    await page.click('[data-testid="save-button"]');

    // Verify item appears in list
    await expect(page.locator('[data-testid="inventory-list"]')).toContainText('Test Widget');

    // Test stock adjustment
    await page.click('[data-testid="inventory-item-TW-001"]');
    await page.click('[data-testid="adjust-stock-button"]');
    await page.fill('[data-testid="adjustment-quantity"]', '50');
    await page.selectOption('[data-testid="adjustment-reason"]', 'damaged');
    await page.click('[data-testid="confirm-adjustment"]');

    // Verify stock level updated
    await expect(page.locator('[data-testid="current-stock"]')).toContainText('50');

    // Test real-time updates (simulate another user's change)
    await page.evaluate(() => {
      // Simulate WebSocket message
      window.dispatchEvent(new CustomEvent('inventory:updated', {
        detail: { itemId: 'TW-001', newStock: 45 }
      }));
    });

    await expect(page.locator('[data-testid="current-stock"]')).toContainText('45');
  });

  test('mobile barcode scanning workflow', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Mobile testing only in Chromium');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to scanning page
    await page.click('[data-testid="scan-barcode-button"]');
    
    // Mock camera permissions
    await page.context().grantPermissions(['camera']);

    // Test barcode input
    await page.fill('[data-testid="barcode-input"]', '123456789012');
    await page.click('[data-testid="lookup-button"]');

    // Verify item lookup
    await expect(page.locator('[data-testid="scanned-item"]')).toContainText('Test Widget');

    // Test quick stock adjustment
    await page.click('[data-testid="quick-add-button"]');
    await page.fill('[data-testid="quantity-input"]', '25');
    await page.click('[data-testid="confirm-add"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });
});
```

### Cross-browser Testing
```typescript
// Cross-browser compatibility tests
import { devices } from '@playwright/test';

const config = {
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] }
    }
  ]
};

test.describe('Cross-browser Compatibility', () => {
  test('inventory management works across all browsers', async ({ page, browserName }) => {
    await page.goto('/inventory');
    
    // Test core functionality
    await page.click('[data-testid="add-inventory-button"]');
    await page.fill('[data-testid="item-name"]', `Cross Browser Item ${browserName}`);
    await page.click('[data-testid="save-button"]');
    
    await expect(page.locator('[data-testid="inventory-list"]'))
      .toContainText(`Cross Browser Item ${browserName}`);
  });
});
```

## Performance Testing

### Load Testing
```typescript
// Load testing with Artillery
// artillery-config.yml
/*
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
  payload:
    path: './test-data.csv'
    fields:
      - 'email'
      - 'password'

scenarios:
  - name: 'Inventory Operations'
    weight: 70
    flow:
      - post:
          url: '/api/auth/login'
          json:
            email: '{{ email }}'
            password: '{{ password }}'
          capture:
            - json: '$.token'
              as: 'authToken'
      - get:
          url: '/api/inventory'
          headers:
            Authorization: 'Bearer {{ authToken }}'
      - post:
          url: '/api/inventory'
          headers:
            Authorization: 'Bearer {{ authToken }}'
          json:
            name: 'Load Test Item {{ $randomString() }}'
            sku: 'LT-{{ $randomInt(1000, 9999) }}'
            currentStock: '{{ $randomInt(10, 1000) }}'
            warehouseId: 'wh-load-test'

  - name: 'Real-time Updates'
    weight: 30
    engine: socketio
    flow:
      - emit:
          channel: 'join-organization'
          data:
            organizationId: 'org-load-test'
      - think: 5
      - emit:
          channel: 'inventory:update'
          data:
            itemId: 'item-{{ $randomInt(1, 100) }}'
            quantity: '{{ $randomInt(1, 50) }}'
*/
```

### Database Performance Testing
```typescript
// Database performance tests
describe('Database Performance', () => {
  test('inventory queries perform within acceptable limits', async () => {
    // Create large dataset
    const items = Array.from({ length: 10000 }, (_, i) => ({
      name: `Performance Test Item ${i}`,
      sku: `PT-${i.toString().padStart(5, '0')}`,
      organizationId: 'org-perf-test',
      warehouseId: 'wh-perf-test',
      currentStock: Math.floor(Math.random() * 1000),
      minimumStock: Math.floor(Math.random() * 50)
    }));

    await prisma.inventoryItem.createMany({ data: items });

    // Test query performance
    const startTime = Date.now();
    
    const result = await prisma.inventoryItem.findMany({
      where: { organizationId: 'org-perf-test' },
      take: 20,
      skip: 0,
      orderBy: { name: 'asc' },
      include: {
        warehouse: { select: { name: true } }
      }
    });

    const queryTime = Date.now() - startTime;

    expect(result).toHaveLength(20);
    expect(queryTime).toBeLessThan(500); // Should complete in under 500ms
  });
});
```

## Test Configuration Files

### Jest Configuration (jest.config.js)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/types/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI
  }
});
```

## CI/CD Testing Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: flowstock_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/flowstock_test
      
      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/flowstock_test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/flowstock_test

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Start application
        run: |
          npm run build
          npm start &
          sleep 10
      
      - name: Run E2E tests
        run: npx playwright test
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Testing Best Practices

### General Guidelines
1. **Test Organization Isolation**: Every test must verify multi-tenant data separation
2. **Mock External Services**: Use mocks for ERP integrations, email, and file storage
3. **Test Real-time Features**: Verify WebSocket functionality and concurrent user scenarios
4. **Mobile Testing**: Include touch interactions and responsive design validation
5. **Performance Validation**: Set performance budgets and test against them
6. **Security Testing**: Validate authentication, authorization, and input sanitization

### Test Data Management
1. **Use Factories**: Create test data factories for consistent object creation
2. **Clean Isolation**: Each test should clean up its data
3. **Realistic Data**: Use representative data volumes and complexity
4. **Seed Management**: Maintain consistent seed data for development and testing

### Continuous Improvement
1. **Monitor Coverage**: Maintain high test coverage for critical paths
2. **Review Failures**: Analyze and learn from test failures
3. **Update Tests**: Keep tests current with feature changes
4. **Performance Monitoring**: Track test execution times and optimize slow tests

This comprehensive testing strategy ensures FlowStock maintains high quality, security, and performance standards across all components and user scenarios.