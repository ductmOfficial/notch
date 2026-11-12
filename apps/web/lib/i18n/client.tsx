"use client";

import { createContext, type ReactNode, use, useMemo } from "react";

import { type Locale, translator, type Translate } from "./messages";

const I18nContext = createContext<{ locale: Locale; t: Translate } | null>(null);

/** Gives client components the language rendered by the server. */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(() => ({ locale, t: translator(locale) }), [locale]);
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n(): { locale: Locale; t: Translate } {
  const value = use(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
