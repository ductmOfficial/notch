"use server";

import { createCalendarToken, revokeCalendarToken } from "@notch/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getDb } from "../../lib/db";
import { isLocale } from "../../lib/i18n/messages";
import { LOCALE_COOKIE } from "../../lib/i18n/server";
import { isPalette, isTheme, PALETTE_COOKIE, THEME_COOKIE } from "../../lib/preferences";
import { requireViewer } from "../../lib/session";

const YEAR = 60 * 60 * 24 * 365;

/** Remembers the theme for this browser. The cookie holds no personal data. */
export async function setThemeAction(theme: string): Promise<void> {
  if (!isTheme(theme)) return;
  const store = await cookies();
  if (theme === "system") store.delete(THEME_COOKIE);
  else store.set(THEME_COOKIE, theme, { path: "/", maxAge: YEAR, sameSite: "lax" });
}

/** Remembers the palette; the lotus, the default, needs no cookie. */
export async function setPaletteAction(palette: string): Promise<void> {
  if (!isPalette(palette)) return;
  const store = await cookies();
  if (palette === "lotus") store.delete(PALETTE_COOKIE);
  else store.set(PALETTE_COOKIE, palette, { path: "/", maxAge: YEAR, sameSite: "lax" });
}

/** Remembers the language for this browser; without it the browser's language is used. */
export async function setLocaleAction(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: YEAR, sameSite: "lax" });
}

function database() {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");
  return db;
}

/**
 * Creates (or replaces) the family's calendar link and returns its secret token: the only
 * time it exists in plain text, so the page shows it once.
 */
export async function createCalendarLinkAction(): Promise<string> {
  const { familyId } = await requireViewer();
  const token = await createCalendarToken(database(), familyId);
  revalidatePath("/settings");
  return token;
}

export async function revokeCalendarLinkAction(): Promise<void> {
  const { familyId } = await requireViewer();
  await revokeCalendarToken(database(), familyId);
  revalidatePath("/settings");
}
