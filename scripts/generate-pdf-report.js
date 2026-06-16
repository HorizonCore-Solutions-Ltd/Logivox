const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

async function main() {
  const mdPath = path.resolve(
    "docs/status-reports/CONSOLIDATED_ARCHITECTURE_AND_CODEBASE_PLAN_2026-06-16.md",
  );
  const pdfPath = path.resolve(
    "docs/status-reports/CONSOLIDATED_ARCHITECTURE_AND_CODEBASE_PLAN_2026-06-16.pdf",
  );

  const md = fs.readFileSync(mdPath, "utf8");

  const escapeHtml = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>LogiVox Consolidated Architecture and Codebase Plan</title>
<style>
  body { font-family: Arial, sans-serif; margin: 36px; line-height: 1.35; }
  h1 { font-size: 22px; margin: 0 0 16px 0; }
  pre { white-space: pre-wrap; word-wrap: break-word; font-size: 11px; }
</style>
</head>
<body>
<h1>LogiVox Consolidated Architecture and Codebase Plan</h1>
<pre>${escapeHtml(md)}</pre>
</body>
</html>`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "18mm", right: "12mm", bottom: "18mm", left: "12mm" },
  });
  await browser.close();

  console.log(`PDF generated: ${pdfPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
