import { test, expect } from '@playwright/test';

test.describe('Load Testing - Inventory Management', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('concurrent inventory queries', async ({ browser }) => {
    const contexts = await Promise.all(
      Array.from({ length: 10 }, () => browser.newContext())
    );

    const start = Date.now();

    await Promise.all(
      contexts.map(async (context) => {
        const page = await context.newPage();
        await page.goto('http://localhost:3000/inventory');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('h1')).toContainText('Inventory');
        await context.close();
      })
    );

    const duration = Date.now() - start;
    console.log(`10 concurrent inventory loads took ${duration}ms`);
    expect(duration).toBeLessThan(10000); // Should complete in under 10 seconds
  });

  test('rapid search operations', async ({ page }) => {
    await page.goto('http://localhost:3000/inventory');

    const searchTerms = ['widget', 'bolt', 'screw', 'plate', 'valve'];
    const start = Date.now();

    for (const term of searchTerms) {
      await page.fill('[placeholder*="Search"]', term);
      await page.waitForTimeout(100); // Debounce simulation
    }

    const duration = Date.now() - start;
    console.log(`5 rapid searches took ${duration}ms`);
    expect(duration).toBeLessThan(2000);
  });
});

test.describe('Load Testing - Order Fulfillment', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('concurrent order creation', async ({ browser }) => {
    const contexts = await Promise.all(
      Array.from({ length: 5 }, () => browser.newContext())
    );

    const results = await Promise.allSettled(
      contexts.map(async (context, index) => {
        const page = await context.newPage();
        await page.goto('http://localhost:3000/orders/new');
        
        // Fill order form
        await page.fill('[name="customerName"]', `Load Test Customer ${index}`);
        await page.fill('[name="orderNumber"]', `LOAD-${Date.now()}-${index}`);
        
        // Submit
        await page.click('button:has-text("Create Order")');
        await page.waitForLoadState('networkidle');
        
        await context.close();
        return { success: true, index };
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    console.log(`${successful}/5 concurrent orders created successfully`);
    expect(successful).toBeGreaterThanOrEqual(4); // Allow 1 failure
  });
});

test.describe('Load Testing - API Performance', () => {
  test('inventory API response time', async ({ request }) => {
    const times: number[] = [];

    for (let i = 0; i < 20; i++) {
      const start = Date.now();
      const response = await request.get('http://localhost:3000/api/inventory');
      const duration = Date.now() - start;
      times.push(duration);
      
      expect(response.ok()).toBeTruthy();
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const maxTime = Math.max(...times);
    
    console.log(`Inventory API - Avg: ${avgTime.toFixed(0)}ms, Max: ${maxTime}ms`);
    expect(avgTime).toBeLessThan(500); // Average under 500ms
    expect(maxTime).toBeLessThan(2000); // Max under 2 seconds
  });

  test('concurrent API calls stress test', async ({ request }) => {
    const endpoints = [
      '/api/inventory',
      '/api/orders',
      '/api/products',
      '/api/warehouses',
      '/api/customers'
    ];

    const start = Date.now();

    const results = await Promise.allSettled(
      Array.from({ length: 50 }, (_, i) => {
        const endpoint = endpoints[i % endpoints.length];
        return request.get(`http://localhost:3000${endpoint}`);
      })
    );

    const duration = Date.now() - start;
    const successful = results.filter(r => r.status === 'fulfilled').length;

    console.log(`50 concurrent API calls: ${successful}/50 successful in ${duration}ms`);
    expect(successful).toBeGreaterThanOrEqual(45); // 90% success rate
    expect(duration).toBeLessThan(15000); // Complete in under 15 seconds
  });
});

test.describe('Load Testing - Database Performance', () => {
  test('large dataset pagination', async ({ page }) => {
    await page.goto('http://localhost:3000/inventory');

    const start = Date.now();

    // Navigate through multiple pages
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Next")');
      await page.waitForLoadState('networkidle');
    }

    const duration = Date.now() - start;
    console.log(`5 page navigations took ${duration}ms`);
    expect(duration).toBeLessThan(5000);
  });

  test('complex filter operations', async ({ page }) => {
    await page.goto('http://localhost:3000/inventory');

    const start = Date.now();

    // Apply multiple filters
    await page.selectOption('[name="category"]', 'Electronics');
    await page.waitForLoadState('networkidle');

    await page.selectOption('[name="status"]', 'IN_STOCK');
    await page.waitForLoadState('networkidle');

    await page.fill('[name="minQuantity"]', '10');
    await page.waitForLoadState('networkidle');

    const duration = Date.now() - start;
    console.log(`Complex filtering took ${duration}ms`);
    expect(duration).toBeLessThan(3000);
  });
});

test.describe('Load Testing - Real-time Features', () => {
  test('websocket connection stability', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Monitor for websocket errors
    const wsErrors: string[] = [];
    page.on('websocketerror', (error) => {
      wsErrors.push(error);
    });

    // Keep page open for 10 seconds
    await page.waitForTimeout(10000);

    expect(wsErrors.length).toBe(0);
  });

  test('real-time notifications', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto('http://localhost:3000/dashboard');
    await page2.goto('http://localhost:3000/dashboard');

    // Simulate action on page1
    await page1.click('button:has-text("Create Order")');

    // Check if page2 receives notification
    await expect(page2.locator('.notification')).toBeVisible({ timeout: 5000 });

    await context1.close();
    await context2.close();
  });
});
