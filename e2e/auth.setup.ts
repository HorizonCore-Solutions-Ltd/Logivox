import { test as setup, expect } from "@playwright/test";
import fs from "fs";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  fs.mkdirSync("playwright/.auth", { recursive: true });

  await page.goto("/sign-in");

  await page.fill('[name="email"]', "admin@logivox.ai");
  await page.fill('[name="password"]', "Admin@Logivox1!");
  await page.waitForTimeout(500);
  await page.click('button[type="submit"]', { force: true });

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60000 });

  await page.context().storageState({ path: authFile });
});
