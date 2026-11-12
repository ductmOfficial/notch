import "./globals.css";

import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { NavLinks } from "../components/NavLinks";
import { QuickAdd } from "../components/QuickAdd";
import { I18nProvider } from "../lib/i18n/client";
import { getI18n } from "../lib/i18n/server";
import { getTheme } from "../lib/preferences";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: "Notch", template: "%s · Notch" },
    description: t("app.description"),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff8f2" },
    { media: "(prefers-color-scheme: dark)", color: "#16130d" },
  ],
};

/**
 * M3 layout: a navigation rail with the FAB on wide screens; on phones a top app bar,
 * a bottom navigation bar and a floating FAB.
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  // The theme chosen in Settings is rendered on the server, so the page never flashes.
  const theme = await getTheme();
  const { t, locale } = await getI18n();
  return (
    <html lang={locale} data-theme={theme === "system" ? undefined : theme}>
      <body className="min-h-dvh bg-surface antialiased">
        <I18nProvider locale={locale}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-m3-sm focus:bg-inverse-surface focus:px-4 focus:py-2 focus:text-inverse-on-surface"
          >
            {t("app.skipToContent")}
          </a>

          <nav
            aria-label={t("app.mainNav")}
            className="fixed inset-y-0 left-0 z-10 hidden w-20 flex-col items-center gap-10 bg-surface pt-4 md:flex"
          >
            <Link href="/" className="title-medium text-primary">
              Notch
            </Link>
            <QuickAdd placement="rail" />
            <NavLinks variant="rail" />
          </nav>

          <header className="flex h-16 items-center px-4 md:hidden">
            <Link href="/" className="title-large text-primary">
              Notch
            </Link>
          </header>

          <main
            id="main"
            className="mx-auto max-w-5xl px-4 pb-32 md:pb-10 md:pl-24 md:pt-6 lg:pl-28"
          >
            {children}
          </main>

          <div className="md:hidden">
            <QuickAdd placement="floating" />
            <nav
              aria-label={t("app.mainNav")}
              className="fixed inset-x-0 bottom-0 z-10 bg-surface-container pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
              <NavLinks variant="bar" />
            </nav>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
