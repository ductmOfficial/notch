import "server-only";

import { cookies } from "next/headers";

export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_COOKIE = "notch-theme";

export const isTheme = (value: unknown): value is Theme =>
  typeof value === "string" && (THEMES as readonly string[]).includes(value);

/** The theme chosen in Settings; "system" follows the operating system. */
export async function getTheme(): Promise<Theme> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : "system";
}

export const PALETTES = ["lotus", "daylily", "cloud"] as const;
export type Palette = (typeof PALETTES)[number];

export const PALETTE_COOKIE = "notch-palette";

export const isPalette = (value: unknown): value is Palette =>
  typeof value === "string" && (PALETTES as readonly string[]).includes(value);

/** The palette chosen in Settings; the lotus is the default. */
export async function getPalette(): Promise<Palette> {
  const value = (await cookies()).get(PALETTE_COOKIE)?.value;
  return isPalette(value) ? value : "lotus";
}
