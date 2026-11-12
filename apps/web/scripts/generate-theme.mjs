#!/usr/bin/env node
/**
 * Generates app/theme.css: the Material Design 3 color schemes of Notch, light and dark, with
 * Google's Material Color Utilities. Each scheme comes from five seed colors: primary,
 * tertiary, "upcoming" (warning), "done" (success) and a hue for the neutral surfaces.
 *
 * - Lotus (sen), the default: pink petal, green leaf (tertiary and "done"), yellow stamen
 *   ("upcoming" and a warm neutral).
 * - Daylily (huyên thảo, `data-palette="daylily"`): orange petal, the green of its long
 *   leaves, its yellow throat.
 * - Cloud (mây, `data-palette="cloud"`): sky blue, the peach of clouds at sunset, sun yellow,
 *   a leaf green for "done" and a cool cloud-grey neutral.
 *
 *   pnpm --filter web theme
 */
import { writeFile } from "node:fs/promises";
import {
  DynamicScheme,
  Hct,
  MaterialDynamicColors,
  TonalPalette,
  argbFromHex,
  differenceDegrees,
  hexFromArgb,
  rotationDirection,
  sanitizeDegreesDouble,
} from "@material/material-color-utilities";

const flower = (petal, leaf, heart) => ({
  primary: petal,
  tertiary: leaf,
  warning: heart,
  success: leaf,
  neutral: heart,
});

const PALETTES = {
  lotus: flower("#D9668C", "#4F8A3C", "#E3B23C"),
  daylily: flower("#E0702C", "#5B8A3A", "#F2B33D"),
  cloud: {
    primary: "#3F86D4",
    tertiary: "#E8916A",
    warning: "#E8B23A",
    success: "#4F8A3C",
    neutral: "#7FA3C9",
  },
};
/** Variant.TONAL_SPOT, the Material You default (the enum is not exported at runtime). */
const TONAL_SPOT = 2;

const ROLES = [
  "primary",
  "onPrimary",
  "primaryContainer",
  "onPrimaryContainer",
  "secondary",
  "onSecondary",
  "secondaryContainer",
  "onSecondaryContainer",
  "tertiary",
  "onTertiary",
  "tertiaryContainer",
  "onTertiaryContainer",
  "error",
  "onError",
  "errorContainer",
  "onErrorContainer",
  "surface",
  "surfaceDim",
  "surfaceBright",
  "onSurface",
  "onSurfaceVariant",
  "surfaceContainerLowest",
  "surfaceContainerLow",
  "surfaceContainer",
  "surfaceContainerHigh",
  "surfaceContainerHighest",
  "outline",
  "outlineVariant",
  "inverseSurface",
  "inverseOnSurface",
  "inversePrimary",
  "scrim",
  "shadow",
];

const hue = (hex) => Hct.fromInt(argbFromHex(hex)).hue;
const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * M3 harmonization (Blend.harmonize) with a smaller reach: the hue turns toward the primary by
 * half the difference, at most 8° instead of 15°. At 15° the lotus's "done" green turned olive.
 */
function harmonize(hex, primary) {
  const from = Hct.fromInt(argbFromHex(hex));
  const to = Hct.fromInt(argbFromHex(primary));
  const rotation = Math.min(differenceDegrees(from.hue, to.hue) * 0.5, 8);
  const hueOut = sanitizeDegreesDouble(from.hue + rotation * rotationDirection(from.hue, to.hue));
  return Hct.from(hueOut, from.chroma, from.tone).toInt();
}

function makeScheme({ primary, tertiary, neutral }, dark) {
  return new DynamicScheme({
    sourceColorArgb: argbFromHex(primary),
    variant: TONAL_SPOT,
    contrastLevel: 0,
    isDark: dark,
    primaryPalette: TonalPalette.fromHueAndChroma(hue(primary), 48),
    secondaryPalette: TonalPalette.fromHueAndChroma(hue(primary), 16),
    tertiaryPalette: TonalPalette.fromHueAndChroma(hue(tertiary), 40),
    neutralPalette: TonalPalette.fromHueAndChroma(hue(neutral), 5),
    neutralVariantPalette: TonalPalette.fromHueAndChroma(hue(neutral), 9),
  });
}

function block(palette, dark) {
  const { success, warning } = palette;
  const scheme = makeScheme(palette, dark);
  const lines = ROLES.map(
    (role) =>
      `  --md-sys-color-${kebab(role)}: ${hexFromArgb(MaterialDynamicColors[role].getArgb(scheme))};`,
  );
  // Status colors as M3 custom color groups: tones 40/100/90/10 light, 80/20/30/90 dark.
  // Harmonized toward the primary color, as M3 does for custom colors: "done" stays green and
  // "upcoming" stays yellow, but each leans a little toward the palette.
  for (const [name, hex] of Object.entries({ success, warning })) {
    const tones = TonalPalette.fromInt(harmonize(hex, palette.primary));
    const [c, on, container, onContainer] = dark ? [80, 20, 30, 90] : [40, 100, 90, 10];
    lines.push(
      `  --md-sys-color-${name}: ${hexFromArgb(tones.tone(c))};`,
      `  --md-sys-color-on-${name}: ${hexFromArgb(tones.tone(on))};`,
      `  --md-sys-color-${name}-container: ${hexFromArgb(tones.tone(container))};`,
      `  --md-sys-color-on-${name}-container: ${hexFromArgb(tones.tone(onContainer))};`,
    );
  }
  return lines.join("\n");
}

const indent = (text) => text.replaceAll("\n", "\n  ").replace(/^/, "  ");

/** Light, system-dark and forced-dark blocks; `p` scopes them to a palette. */
function schemeCss(palette, p = "") {
  const light = p ? `${p},\n${p}[data-theme="light"]` : `:root,\n[data-theme="light"]`;
  const systemDark = p ? `${p}:not([data-theme="light"])` : `:root:not([data-theme="light"])`;
  return `${light} {
  color-scheme: light;
${block(palette, false)}
}

@media (prefers-color-scheme: dark) {
  ${systemDark} {
    color-scheme: dark;
${indent(block(palette, true))}
  }
}

${p}[data-theme="dark"] {
  color-scheme: dark;
${block(palette, true)}
}
`;
}

const css = `/* Generated by scripts/generate-theme.mjs. Do not edit by hand. */

/* Lotus, the default palette. */
${schemeCss(PALETTES.lotus)}
/* The other palettes. Their selectors are more specific or come later, so they win over the lotus. */
${schemeCss(PALETTES.daylily, '[data-palette="daylily"]')}
${schemeCss(PALETTES.cloud, '[data-palette="cloud"]')}`;

await writeFile(new URL("../app/theme.css", import.meta.url), css);
console.log("app/theme.css written");
