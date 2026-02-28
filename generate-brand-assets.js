const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'apps/web/public/icons');
const brandDir = path.join(__dirname, 'assets/brand/logos');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir, { recursive: true });

// A highly sophisticated SVG for "LogiVox" (WMS + Voice)
// Represents a 3D isometric shipping box that merges into a voice waveform pattern
const svgMarkup = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="box-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <linearGradient id="box-top" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0ea5e9" />
    </linearGradient>
    <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7dd3fc" />
      <stop offset="100%" stop-color="#e0f2fe" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="15" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <rect width="512" height="512" rx="112" fill="url(#box-grad1)" filter="url(#shadow)" />
  
  <g transform="translate(60, 80)">
    <!-- Isometric Box Outline representing Warehouse Management -->
    <!-- Top Face -->
    <path d="M 196 60 L 336 120 L 196 180 L 56 120 Z" fill="url(#box-top)" />
    <!-- Left Face -->
    <path d="M 56 120 L 196 180 L 196 340 L 56 280 Z" fill="#0284c7" />
    <!-- Right Face -->
    <path d="M 196 180 L 336 120 L 336 280 L 196 340 Z" fill="#0369a1" />
    
    <!-- Edge Accents -->
    <path d="M 56 120 L 196 180 M 336 120 L 196 180 M 196 180 L 196 340" stroke="#bae6fd" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Voice Waveforms emerging from the right side of the box -->
    <!-- Representing the "Vox" in LogiVox -->
    <path d="M 270 90 Q 320 60 360 100" fill="none" stroke="url(#wave-grad)" stroke-width="12" stroke-linecap="round" filter="url(#glow)"/>
    <path d="M 290 130 Q 350 100 400 150" fill="none" stroke="url(#wave-grad)" stroke-width="14" stroke-linecap="round" filter="url(#glow)"/>
    <path d="M 280 180 Q 360 150 420 220" fill="none" stroke="url(#wave-grad)" stroke-width="16" stroke-linecap="round" filter="url(#glow)"/>
    <path d="M 260 230 Q 350 210 390 290" fill="none" stroke="url(#wave-grad)" stroke-width="14" stroke-linecap="round" filter="url(#glow)"/>
  </g>
</svg>
`;

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
    ${svgMarkup}
  </body>
</html>
`;

async function generateIcons() {
  fs.writeFileSync(path.join(__dirname, 'icon.html'), htmlContent);
  // Also save the SVG vector
  fs.writeFileSync(path.join(outputDir, '../favicon.svg'), svgMarkup);
  fs.writeFileSync(path.join(brandDir, 'logivox-logo-mark.svg'), svgMarkup);

  const browser = await chromium.launch({ headless: true });
  
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  
  for (const size of sizes) {
    const page = await browser.newPage({ viewport: { width: size, height: size }});
    await page.goto("file://" + path.join(__dirname, 'icon.html'));
    
    // Ensure render
    await page.waitForTimeout(500); 
    
    // Transparent screenshot, but our svg has rounded corners so it's a solid app icon anyway
    const outputPath = path.join(outputDir, "icon-" + size + "x" + size + ".png");
    await page.screenshot({ path: outputPath, omitBackground: true });
    console.log("Generated " + outputPath);
    
    await page.close();
  }

  // Generate generic app icon for brand dir
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }});
  await page.goto("file://" + path.join(__dirname, 'icon.html'));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(brandDir, 'logivox-app-icon.png'), omitBackground: true });
  console.log('Generated Brand High-Res Icon');
  
  await browser.close();
  // Cleanup tmp html
  fs.unlinkSync(path.join(__dirname, 'icon.html'));
}

generateIcons().catch(console.error);
