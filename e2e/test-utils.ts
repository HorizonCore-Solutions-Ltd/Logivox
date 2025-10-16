/**
 * Test Utilities
 * Helper functions for testing
 */

import { Page } from '@playwright/test';

/**
 * Login helper for E2E tests
 */
export async function login(page: Page, email: string = 'admin@flowstock.com', password: string = 'password') {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect after login
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * Logout helper for E2E tests
 */
export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('/login');
}

/**
 * Navigate to a specific page
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(page: Page, url: string) {
  return await page.waitForResponse((response) => response.url().includes(url));
}

/**
 * Fill form helper
 */
export async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [name, value] of Object.entries(fields)) {
    await page.fill(`[name="${name}"]`, value);
  }
}

/**
 * Select dropdown option
 */
export async function selectOption(page: Page, selector: string, value: string) {
  await page.click(selector);
  await page.click(`[role="option"][data-value="${value}"]`);
}

/**
 * Upload file
 */
export async function uploadFile(page: Page, selector: string, filePath: string) {
  const fileInput = await page.locator(selector);
  await fileInput.setInputFiles(filePath);
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, message?: string) {
  const toast = page.locator('[role="alert"]');
  await toast.waitFor({ state: 'visible' });
  
  if (message) {
    await toast.filter({ hasText: message }).waitFor({ state: 'visible' });
  }
  
  return toast;
}

/**
 * Take screenshot with custom name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}

/**
 * Mock API response
 */
export async function mockApiResponse(page: Page, url: string, response: any) {
  await page.route(url, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Create test inventory item
 */
export async function createTestItem(page: Page, itemData: {
  sku: string;
  name: string;
  unitPrice: number;
}) {
  await navigateTo(page, '/inventory/new');
  
  await page.fill('[name="sku"]', itemData.sku);
  await page.fill('[name="name"]', itemData.name);
  await page.fill('[name="unitPrice"]', itemData.unitPrice.toString());
  await page.fill('[name="reorderPoint"]', '10');
  await page.fill('[name="reorderQuantity"]', '100');
  
  await page.click('button[type="submit"]');
  await waitForToast(page, 'Item created successfully');
}

/**
 * Create test sales order
 */
export async function createTestSalesOrder(page: Page, orderData: {
  customerName: string;
  items: Array<{ sku: string; quantity: number }>;
}) {
  await navigateTo(page, '/orders/sales/new');
  
  // Fill customer info
  await page.fill('[name="customerName"]', orderData.customerName);
  
  // Add items
  for (const item of orderData.items) {
    await page.click('[data-testid="add-line-button"]');
    await page.fill('[name="sku"]', item.sku);
    await page.fill('[name="quantity"]', item.quantity.toString());
  }
  
  await page.click('button[type="submit"]');
  await waitForToast(page, 'Order created successfully');
}

/**
 * Search in data table
 */
export async function searchTable(page: Page, query: string) {
  await page.fill('[data-testid="table-search"]', query);
  await page.waitForTimeout(500); // Wait for debounce
}

/**
 * Sort table column
 */
export async function sortTableColumn(page: Page, columnName: string) {
  await page.click(`[data-testid="sort-${columnName}"]`);
}

/**
 * Paginate table
 */
export async function goToPage(page: Page, pageNumber: number) {
  await page.click(`[data-testid="page-${pageNumber}"]`);
}

/**
 * Delete item from table
 */
export async function deleteTableRow(page: Page, rowId: string) {
  await page.click(`[data-testid="delete-${rowId}"]`);
  await page.click('[data-testid="confirm-delete"]');
  await waitForToast(page, 'Deleted successfully');
}

/**
 * Check if element is visible
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for loading to complete
 */
export async function waitForLoading(page: Page) {
  // Wait for loading spinner to appear
  const spinner = page.locator('[data-testid="loading-spinner"]');
  try {
    await spinner.waitFor({ state: 'visible', timeout: 1000 });
  } catch {
    // Spinner might not appear for fast operations
  }
  
  // Wait for it to disappear
  await spinner.waitFor({ state: 'hidden', timeout: 10000 });
}

/**
 * Get table row count
 */
export async function getTableRowCount(page: Page): Promise<number> {
  const rows = await page.locator('[data-testid^="table-row-"]').count();
  return rows;
}

/**
 * Clear all filters
 */
export async function clearFilters(page: Page) {
  await page.click('[data-testid="clear-filters"]');
}

/**
 * Export data
 */
export async function exportData(page: Page, format: 'csv' | 'excel') {
  const downloadPromise = page.waitForEvent('download');
  await page.click(`[data-testid="export-${format}"]`);
  const download = await downloadPromise;
  return download;
}

/**
 * Switch warehouse
 */
export async function switchWarehouse(page: Page, warehouseName: string) {
  await page.click('[data-testid="warehouse-selector"]');
  await page.click(`[data-testid="warehouse-${warehouseName}"]`);
}
