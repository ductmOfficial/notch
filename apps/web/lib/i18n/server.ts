import "server-only";

import { cookies, headers } from "next/headers";

import { isLocale, type Locale, negotiateLocale, translator, type Translate } from "./messages";

export const LOCALE_COOKIE = "notch-locale";

/** The language chosen in Settings, else the browser's (Accept-Language), else Vietnamese. */
export async function getLocale(): Promise<Locale> {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;
  return negotiateLocale((await headers()).get("accept-language"));
}

export async function getI18n(): Promise<{ locale: Locale; t: Translate }> {
  const locale = await getLocale();
  return { locale, t: translator(locale) };
}
