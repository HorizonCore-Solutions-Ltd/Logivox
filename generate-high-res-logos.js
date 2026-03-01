const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const brandDir = path.join(__dirname, "assets/brand/logos");

// Read the SVG
const svgContent = fs.readFileSync(
  path.join(brandDir, "logivox-logo-mark.svg"),
  "utf8",
);

const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { margin: 0; padding: 0; overflow: hidden; background: transparent; }
      svg { width: 100vw; height: 100vh; display: block; }
    </style>
  </head>
  <body>
    ${svgContent}
  </body>
</html>
`;

async function generateHighResPNGs() {
  fs.writeFileSync(path.join(__dirname, "temp-icon.html"), htmlContent);

  const browser = await chromium.launch({ headless: true });

  // Generate multiple sizes for different use cases
  const sizes = [
    { size: 512, name: "logivox-logo-512.png", desc: "Standard web/app" },
    { size: 1024, name: "logivox-logo-1024.png", desc: "High-res web/retina" },
    { size: 2048, name: "logivox-logo-2048.png", desc: "Print quality" },
    { size: 4096, name: "logivox-logo-4096.png", desc: "Ultra high-res print" },
  ];

  for (const { size, name, desc } of sizes) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
    });
    await page.goto("file://" + path.join(__dirname, "temp-icon.html"));
    await page.waitForTimeout(500);

    const outputPath = path.join(brandDir, name);
    await page.screenshot({ path: outputPath, omitBackground: false });
    console.log(`✅ Generated ${name} (${size}x${size}) - ${desc}`);
    await page.close();
  }

  await browser.close();

  // Cleanup temp file
  fs.unlinkSync(path.join(__dirname, "temp-icon.html"));

  console.log("\n🎉 All high-resolution PNG logos generated!");
  console.log(`📁 Location: ${brandDir}`);
}

generateHighResPNGs().catch(console.error);
