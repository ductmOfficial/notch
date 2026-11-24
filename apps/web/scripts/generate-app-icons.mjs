#!/usr/bin/env node
/**
 * Renders the app icons for the web app manifest and iOS from app/icon.svg, in a local
 * browser (Playwright), so the PNGs carry nothing but pixels:
 *
 * - public/icons/icon-192.png, icon-512.png: the icon as it is, rounded corners included;
 * - public/icons/maskable-512.png and app/apple-icon.png (180px): full-bleed cream square
 *   with the lotus inside the safe zone, for launchers and iOS that cut their own shape.
 *
 *   pnpm --filter web app-icons   (CHROME_PATH picks a local Chrome, as for the e2e tests)
 */
import { readFile } from "node:fs/promises";

import { chromium } from "@playwright/test";

const root = new URL("..", import.meta.url);
const svg = await readFile(new URL("app/icon.svg", root), "utf8");
// Without the rounded background, for the full-bleed variants.
const inner = svg.replace(/<rect[^>]*\/>/, "").replace(/<\/?svg[^>]*>/g, "");
const CREAM = "#fff8f2";

const fullBleed = (scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect width="24" height="24" fill="${CREAM}"/>
  <g transform="translate(12 12) scale(${String(scale)}) translate(-12 -12)">${inner}</g>
</svg>`;

const targets = [
  { file: "public/icons/icon-192.png", size: 192, svg },
  { file: "public/icons/icon-512.png", size: 512, svg },
  // Maskable icons keep their content within the central 80% circle.
  { file: "public/icons/maskable-512.png", size: 512, svg: fullBleed(0.72) },
  { file: "app/apple-icon.png", size: 180, svg: fullBleed(0.82) },
];

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
);
try {
  for (const { file, size, svg: source } of targets) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}svg{display:block;width:${String(size)}px;height:${String(size)}px}</style>${source}`,
    );
    await page.screenshot({ path: new URL(file, root).pathname, omitBackground: true });
    await page.close();
    console.log(`${file} written`);
  }
} finally {
  await browser.close();
}
