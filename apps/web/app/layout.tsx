import "./globals.css";

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { NavLinks } from "../components/NavLinks";

export const metadata: Metadata = {
  title: { default: "Notch", template: "%s · Notch" },
  description: "Sổ lớn khôn của bé: tăng trưởng, tiêm chủng và sức khỏe của con.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-dvh font-sans antialiased">
        <header className="border-b border-[var(--border)] bg-[var(--surface)]">
          <nav aria-label="Chính" className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Notch
            </Link>
            <NavLinks />
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
