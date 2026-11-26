import "./globals.css";

import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";

import { MotifBackdrop, MotifMark } from "../components/Motifs";
import { NavLinks } from "../components/NavLinks";
import { QuickAdd } from "../components/QuickAdd";
import { DemoBanner } from "../components/DemoBanner";
import { ServiceWorker } from "../components/ServiceWorker";
import { I18nProvider } from "../lib/i18n/client";
import { getI18n } from "../lib/i18n/server";
import { getPalette, getTheme } from "../lib/preferences";
import { isDemo } from "../lib/demo";
import { SHARED_PAGE_HEADER } from "../lib/shared-page";
import { getViewer, mayEdit } from "../lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: "Notch", template: "%s · Notch" },
    description: t("app.description"),
    // Opened from the home screen, iOS shows it without the browser bar.
    appleWebApp: { capable: true, title: "Notch", statusBarStyle: "default" },
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
  // Theme and palette chosen in Settings are rendered on the server, so the page never flashes.
  const [theme, palette, signedIn, demoBrowser, request] = await Promise.all([
    getTheme(),
    getPalette(),
    getViewer(),
    isDemo(),
    headers(),
  ]);
  // A shared child's page looks the same to everyone: the public frame, without the family's
  // navigation or the demo banner, even for a family member or a demo browser.
  const shared = request.get(SHARED_PAGE_HEADER) === "1";
  const viewer = shared ? undefined : signedIn;
  const demo = demoBrowser && !shared;
  const { t, locale } = await getI18n();
  return (
    <html
      lang={locale}
      data-theme={theme === "system" ? undefined : theme}
      data-palette={palette === "lotus" ? undefined : palette}
    >
      {/* data-role hides add and edit controls from viewers (.editor-only in globals.css); the
          server actions refuse their writes in any case. */}
      <body className="min-h-dvh bg-surface antialiased" data-role={viewer?.role}>
        <I18nProvider locale={locale}>
          <MotifBackdrop />
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-m3-sm focus:bg-inverse-surface focus:px-4 focus:py-2 focus:text-inverse-on-surface"
          >
            {t("app.skipToContent")}
          </a>

          {/* Signed out (the sign-in page), there is nowhere to go: no navigation. */}
          {viewer ? (
            <>
              <nav
                aria-label={t("app.mainNav")}
                className="fixed inset-y-0 left-0 z-10 hidden w-20 flex-col items-center gap-10 bg-surface pt-4 md:flex"
              >
                <Link
                  href="/"
                  className="label-large flex flex-col items-center gap-1 text-primary"
                >
                  <MotifMark size={32} />
                  Notch
                </Link>
                {mayEdit(viewer) && <QuickAdd placement="rail" />}
                <NavLinks variant="rail" />
              </nav>

              <header className="flex h-16 items-center px-4 md:hidden">
                <Link href="/" className="title-large flex items-center gap-2 text-primary">
                  <MotifMark size={28} />
                  Notch
                </Link>
              </header>
            </>
          ) : (
            <header className="flex h-16 items-center px-4 md:px-6">
              <span className="title-large flex items-center gap-2 text-primary">
                <MotifMark size={28} />
                Notch
              </span>
            </header>
          )}

          <main
            id="main"
            className={`mx-auto max-w-7xl px-4 ${viewer ? "pb-32 md:pb-10 md:pl-24 md:pt-6 lg:pl-28" : "pb-10"}`}
          >
            {demo && <DemoBanner />}
            {children}
          </main>

          {viewer && (
            <div className="md:hidden">
              {mayEdit(viewer) && <QuickAdd placement="floating" />}
              <nav
                aria-label={t("app.mainNav")}
                className="fixed inset-x-0 bottom-0 z-10 bg-surface-container pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
              >
                <NavLinks variant="bar" />
              </nav>
            </div>
          )}
        </I18nProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
