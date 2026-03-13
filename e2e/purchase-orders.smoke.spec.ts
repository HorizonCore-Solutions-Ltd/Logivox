import { expect, test } from "@playwright/test";

test.use({ storageState: "playwright/.auth/user.json" });

test.describe("Purchase Orders Smoke", () => {
  test("should create, approve, and send a purchase order", async ({
    page,
  }) => {
    const uniqueSuffix = Date.now().toString().slice(-6);

    await page.goto("/dashboard/purchase-orders/new");

    const supplierSelect = page.locator("select").first();
    await expect(supplierSelect).toBeVisible();
    const supplierOptions = supplierSelect.locator("option");
    const optionCount = await supplierOptions.count();
    expect(optionCount).toBeGreaterThan(1);
    const supplierValue = await supplierOptions.nth(1).getAttribute("value");
    expect(supplierValue).toBeTruthy();
    await supplierSelect.selectOption(supplierValue!);

    await page.fill(
      'input[placeholder="Street address"]',
      "100 Test Dock Road",
    );
    await page.fill('input[placeholder="City"]', "Cape Town");
    await page.fill('input[placeholder="Country"]', "South Africa");
    await page.fill(
      'textarea[placeholder="Supplier instructions, special requirements…"]',
      `Smoke test PO ${uniqueSuffix}`,
    );

    await page.fill('input[placeholder="SKU-001"]', `SMOKE-${uniqueSuffix}`);
    await page.locator('input[type="number"]').first().fill("5");
    await page.locator('input[type="number"]').nth(1).fill("12.50");
    await page.fill(
      'input[placeholder="Product description"]',
      `Smoke test item ${uniqueSuffix}`,
    );

    await page
      .getByRole("button", { name: "Create Purchase Order" })
      .evaluate((button: HTMLButtonElement) => button.click());

    await expect(page).toHaveURL(/\/dashboard\/purchase-orders\/[^/]+$/, {
      timeout: 30000,
    });
    await expect(page.getByRole("button", { name: "Approve" })).toBeVisible();
    await expect(
      page.getByText(`Smoke test item ${uniqueSuffix}`),
    ).toBeVisible();

    await page.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText("Approved")).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "Send to Supplier" }).click();
    await expect(page.getByText("Sent to Supplier")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("button", { name: /Receive Goods/ }),
    ).toBeVisible();
  });
});
