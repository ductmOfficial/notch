import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "./icons";

/** Page frame for a form: back link, title, the child it is for, and the form on a surface. */
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
    <div className="mx-auto max-w-2xl space-y-4 pt-2">
      <Link
        href={back.href}
        className="state-layer label-large -ml-3 inline-flex h-10 items-center gap-1 rounded-full px-3 text-on-surface-variant"
      >
        <Icon name="back" size={18} />
        {back.label}
      </Link>
      <header>
        <h1 className="headline-small">{title}</h1>
        <p className="body-medium text-on-surface-variant">Cho {childName}</p>
      </header>
      <section className="rounded-m3-md bg-surface-container-low p-4 sm:p-6">{children}</section>
      {footer}
    </div>
  );
}
