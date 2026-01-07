/**
 * E2E Tests - Inventory Management
 */

import { test, expect } from "@playwright/test";
import { login, waitForToast, searchTable, deleteTableRow } from "./test-utils";

test.describe("Inventory Management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should create new inventory item", async ({ page }) => {
    await page.goto("/inventory/new");

    // Fill form
    await page.fill('[name="sku"]', "TEST-SKU-001");
    await page.fill('[name="name"]', "Test Product");
    await page.fill('[name="description"]', "Test description");
    await page.fill('[name="unitPrice"]', "99.99");
    await page.fill('[name="unitCost"]', "49.99");
    await page.fill('[name="reorderPoint"]', "10");
    await page.fill('[name="reorderQuantity"]', "100");

    await page.click('button[type="submit"]');

    // Should show success message
    await waitForToast(page, "Item created successfully");

    // Should redirect to list
    await expect(page).toHaveURL(/\/inventory$/);
  });

  test("should search inventory items", async ({ page }) => {
    await page.goto("/inventory");

    // Search for item
    await searchTable(page, "TEST-SKU");

    // Should show filtered results
    const rows = page.locator('[data-testid^="table-row-"]');
    await expect(rows.first()).toContainText("TEST-SKU");
  });

  test("should update inventory item", async ({ page }) => {
    await page.goto("/inventory");

    // Click first edit button
    const editButton = page.locator('[data-testid^="edit-"]').first();
    await editButton.click();

    // Update name
    await page.fill('[name="name"]', "Updated Product Name");
    await page.click('button[type="submit"]');

    // Should show success message
    await waitForToast(page, "Item updated successfully");
  });

  test("should delete inventory item", async ({ page }) => {
    await page.goto("/inventory");

    // Get first item ID
    const firstRow = page.locator('[data-testid^="table-row-"]').first();
    const itemId = await firstRow
      .getAttribute("data-testid")
      .then((id) => id?.replace("table-row-", ""));

    if (itemId) {
      await deleteTableRow(page, itemId);
    }
  });

  test("should adjust stock levels", async ({ page }) => {
    await page.goto("/inventory");

    // Click first stock adjust button
    const adjustButton = page.locator('[data-testid^="adjust-stock-"]').first();
    await adjustButton.click();

    // Fill adjustment form
    await page.selectOption('[name="adjustmentType"]', "MANUAL");
    await page.fill('[name="quantity"]', "50");
    await page.fill('[name="reason"]', "Test adjustment");
    await page.click('button[type="submit"]');

    // Should show success
    await waitForToast(page, "Stock adjusted successfully");
  });

  test("should show low stock alert", async ({ page }) => {
    await page.goto("/inventory");

    // Click low stock filter
    await page.click('[data-testid="filter-low-stock"]');

    // Should show only low stock items
    const lowStockBadge = page.locator('[data-testid="low-stock-badge"]');
    const count = await lowStockBadge.count();

    expect(count).toBeGreaterThan(0);
  });

  test("should export inventory data", async ({ page }) => {
    await page.goto("/inventory");

    // Click export button
    const downloadPromise = page.waitForEvent("download");
    await page.click('[data-testid="export-csv"]');
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toContain("inventory");
  });
});
