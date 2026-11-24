import Link from "next/link";
import type { ReactNode } from "react";

import { getI18n } from "../lib/i18n/server";
import { mayEdit, requireViewer } from "../lib/session";
import { Icon } from "./icons";

/**
 * Page frame for a form: back link, title, the child it is for, and the form on a surface.
 * Viewers get a short note instead of the form.
 */
export async function FormPage({
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
  const [{ t }, viewer] = await Promise.all([getI18n(), requireViewer()]);
  const editable = mayEdit(viewer);
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
        <p className="body-medium text-on-surface-variant">
          {t("common.forChild", { name: childName })}
        </p>
      </header>
      {editable ? (
        <>
          <section className="rounded-m3-md bg-surface-container-low p-4 sm:p-6">
            {children}
          </section>
          {footer}
        </>
      ) : (
        // A viewer who follows a link here sees why there is no form.
        <section className="body-medium rounded-m3-md bg-surface-container-low p-4 sm:p-6">
          {t("members.readOnly")}
        </section>
      )}
    </div>
  );
}
