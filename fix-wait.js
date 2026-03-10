const fs = require("fs");
const file = "e2e/auth.spec.ts";
let content = fs.readFileSync(file, "utf8");

content = content.replace(
  'await expect(page).toHaveURL("/");',
  'await page.waitForTimeout(2000);\n    await expect(page).toHaveURL("/");',
);
fs.writeFileSync(file, content);
