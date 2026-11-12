import "./globals.css";

import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { NavLinks } from "../components/NavLinks";
import { QuickAdd } from "../components/QuickAdd";

export const metadata: Metadata = {
  title: { default: "Notch", template: "%s · Notch" },
  description: "Sổ lớn khôn của bé: tăng trưởng, tiêm chủng và sức khỏe của con.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1a110e" },
  ],
};

/**
 * M3 layout: a navigation rail with the FAB on wide screens; on phones a top app bar,
 * a bottom navigation bar and a floating FAB.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-dvh bg-surface antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-m3-sm focus:bg-inverse-surface focus:px-4 focus:py-2 focus:text-inverse-on-surface"
        >
          Bỏ qua điều hướng
        </a>

        <nav
          aria-label="Chính"
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

        <main id="main" className="mx-auto max-w-5xl px-4 pb-32 md:pb-10 md:pl-24 md:pt-6 lg:pl-28">
          {children}
        </main>

        <div className="md:hidden">
          <QuickAdd placement="floating" />
          <nav
            aria-label="Chính"
            className="fixed inset-x-0 bottom-0 z-10 bg-surface-container pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <NavLinks variant="bar" />
          </nav>
        </div>
      </body>
    </html>
  );
}
