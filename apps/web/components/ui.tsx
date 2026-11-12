import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getI18n } from "../lib/i18n/server";
import { CardMotif, type CardMotifProps, MotifMark } from "./Motifs";

const CARD = {
  /** M3 filled card: the default container for a block of content. */
  filled: "bg-surface-container-highest text-on-surface",
  /** M3 elevated-style surface without shadow, for quieter blocks. */
  low: "bg-surface-container-low text-on-surface",
  /** Highlighted card on the primary container color. */
  primary: "bg-primary-container text-on-primary-container",
  /** Needs attention, such as an overdue appointment. */
  error: "bg-error-container text-on-error-container",
  /** M3 outlined card. */
  outlined: "border border-outline-variant bg-surface text-on-surface",
} as const;

/** A card; `motif` adds a faint drawing of the palette, for cards with room to spare. */
export function Card({
  children,
  tone = "low",
  className = "",
  motif,
}: {
  children: ReactNode;
  tone?: keyof typeof CARD;
  className?: string;
  motif?: CardMotifProps;
}) {
  return (
    <section
      className={`rounded-m3-md p-4 ${CARD[tone]} ${motif ? "relative isolate overflow-hidden" : ""} ${className}`}
    >
      {motif && <CardMotif {...motif} />}
      {children}
    </section>
  );
}

export function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card tone="outlined" className="p-6">
      <MotifMark size={48} className="mb-4" />
      <h1 className="title-large mb-2">{title}</h1>
      <p className="body-medium text-on-surface-variant">{children}</p>
    </Card>
  );
}

const TONES = {
  overdue: "bg-error-container text-on-error-container",
  today: "bg-primary text-on-primary",
  soon: "bg-warning-container text-on-warning-container",
  done: "bg-success-container text-on-success-container",
  neutral: "border border-outline-variant text-on-surface-variant",
} as const;

/** Status label in the shape of an M3 chip (8px corners, label-large text). */
export function Badge({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  return (
    <span
      className={`label-large inline-flex h-8 items-center rounded-m3-sm px-3 whitespace-nowrap ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export async function NoDatabase() {
  const { t } = await getI18n();
  return <Notice title={t("setup.noDatabase")}>{t("setup.noDatabaseHint")}</Notice>;
}

/** No child in the signed-in family yet: the first run starts on the welcome page. */
export function NoChild(): never {
  redirect("/welcome");
}
