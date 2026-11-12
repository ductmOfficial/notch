"use server";

import { cookies } from "next/headers";

import { isTheme, THEME_COOKIE } from "../../lib/preferences";

const YEAR = 60 * 60 * 24 * 365;

/** Remembers the theme for this browser. The cookie holds no personal data. */
export async function setThemeAction(theme: string): Promise<void> {
  if (!isTheme(theme)) return;
  const store = await cookies();
  if (theme === "system") store.delete(THEME_COOKIE);
  else store.set(THEME_COOKIE, theme, { path: "/", maxAge: YEAR, sameSite: "lax" });
}
