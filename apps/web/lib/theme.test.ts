import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

// The generated M3 schemes (lotus, daylily and cloud) must keep text readable: WCAG 2.2 AA asks 4.5:1 for text and 3:1 for
// borders and controls, in light and in dark.
const css = readFileSync(new URL("../app/theme.css", import.meta.url), "utf8");

function scheme(selector: string): Map<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`${selector} is missing from theme.css`);
  const body = css.slice(start, css.indexOf("}", start));
  return new Map(
    [...body.matchAll(/--md-sys-color-([a-z-]+): (#[0-9a-f]{6});/g)].map((m) => [
      m[1] ?? "",
      m[2] ?? "",
    ]),
  );
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT: [string, string][] = [
  ["on-surface", "surface"],
  ["on-surface", "surface-container-highest"],
  ["on-surface-variant", "surface"],
  ["on-surface-variant", "surface-container-low"],
  ["on-surface-variant", "surface-container-highest"],
  ["primary", "surface"],
  ["primary", "surface-container-low"],
  ["on-primary", "primary"],
  ["on-primary-container", "primary-container"],
  ["on-secondary-container", "secondary-container"],
  ["on-error", "error"],
  ["on-error-container", "error-container"],
  ["on-success-container", "success-container"],
  ["on-warning-container", "warning-container"],
  ["inverse-on-surface", "inverse-surface"],
];
const NON_TEXT: [string, string][] = [
  ["outline", "surface"],
  // The check on a given dose.
  ["success", "surface-container-low"],
];

const DAYLILY = '[data-palette="daylily"]';
const CLOUD = '[data-palette="cloud"]';

describe.each([
  ["lotus light", ':root,\n[data-theme="light"]'],
  ["lotus dark", '[data-theme="dark"]'],
  ["daylily light", `${DAYLILY},\n${DAYLILY}[data-theme="light"]`],
  ["daylily dark", `${DAYLILY}[data-theme="dark"]`],
  ["cloud light", `${CLOUD},\n${CLOUD}[data-theme="light"]`],
  ["cloud dark", `${CLOUD}[data-theme="dark"]`],
])("%s scheme", (_, selector) => {
  const colors = scheme(selector);
  const pick = (role: string) => {
    const hex = colors.get(role);
    if (!hex) throw new Error(`${role} is missing from theme.css`);
    return hex;
  };

  it.each(TEXT)("%s on %s is at least 4.5:1", (fg, bg) => {
    expect(contrast(pick(fg), pick(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(NON_TEXT)("%s on %s is at least 3:1", (fg, bg) => {
    expect(contrast(pick(fg), pick(bg))).toBeGreaterThanOrEqual(3);
  });
});
