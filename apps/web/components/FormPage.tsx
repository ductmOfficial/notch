import Link from "next/link";
import type { ReactNode } from "react";

/** Page frame for a form: back link, title, the child it is for, and the form in a card. */
export function FormPage({
  title,
  childName,
  back,
  children,
  footer,
}: {
  title: string;
  childName: string;
  back: { href: string; label: string };
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href={back.href} className="text-sm text-[var(--muted)] hover:text-[var(--text)]">
        ← {back.label}
      </Link>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-[var(--muted)]">Cho {childName}</p>
      </header>
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
        {children}
      </section>
      {footer}
    </div>
  );
}
