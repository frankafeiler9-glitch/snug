// Generates the PNG app icons in public/icons from an inline SVG.
// Run with: node scripts/make-icons.js   (needs Playwright; only used once)
const { chromium } = require("playwright");
const path = require("path");

const svg = (padding) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#e0607e"/>
  <g transform="translate(${padding} ${padding}) scale(${(512 - 2 * padding) / 512})">
    <path fill="#fff" d="M256 430s-150-92-150-212c0-54 40-94 90-94 30 0 50 14 60 32 10-18 30-32 60-32 50 0 90 40 90 94 0 120-150 212-150 212z"/>
  </g>
</svg>`;

const icons = [
  { file: "icon-192.png", size: 192, padding: 40 },
  { file: "icon-512.png", size: 512, padding: 40 },
  { file: "icon-maskable-512.png", size: 512, padding: 100 },
  { file: "apple-touch-icon.png", size: 180, padding: 40 },
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const { file, size, padding } of icons) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>body{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${svg(padding)}`);
    await page.screenshot({ path: path.join(__dirname, "..", "public", "icons", file) });
  }
  await browser.close();
})();
