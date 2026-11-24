import type { HealthEntry, Measurement, Milestone, MilestoneKind, Vaccination } from "@notch/db";
import { CATALOG } from "@notch/vaccines";

import { formatNumber } from "./format";
import { entryPeriod, healthKindLabel } from "./health-view";
import { type Locale, type MessageKey, translator } from "./i18n/messages";
import { productDiseases, productName } from "./vaccines-view";

export type TimelineKind = "milestone" | "health" | "measurement" | "dose";

export interface TimelineEvent {
  readonly id: string;
  readonly kind: TimelineKind;
  /** YYYY-MM-DD */
  readonly date: string;
  readonly title: string;
  readonly detail: string | null;
  /** Where to edit it, for the family's own milestones. */
  readonly href: string | null;
  /** The kind of milestone, to label it. */
  readonly milestoneKind?: MilestoneKind;
}

export interface TimelineMonth {
  /** YYYY-MM */
  readonly month: string;
  readonly events: readonly TimelineEvent[];
}

export const TIMELINE_FILTERS = ["all", "milestone", "health", "measurement", "dose"] as const;
export type TimelineFilter = (typeof TIMELINE_FILTERS)[number];

export const isTimelineFilter = (value: unknown): value is TimelineFilter =>
  typeof value === "string" && (TIMELINE_FILTERS as readonly string[]).includes(value);

const MILESTONE_LABELS: Record<MilestoneKind, MessageKey> = {
  motor: "milestone.kindMotor",
  language: "milestone.kindLanguage",
  teeth: "milestone.kindTeeth",
  social: "milestone.kindSocial",
  other: "milestone.kindOther",
};

export const milestoneKindLabel = (kind: MilestoneKind, locale: Locale): string =>
  translator(locale)(MILESTONE_LABELS[kind]);

/**
 * The child's story, most recent first: milestones the family wrote down, the health log,
 * measurements and doses, grouped by month. A filter keeps one kind.
 */
export function buildTimeline(
  input: {
    readonly milestones: readonly Milestone[];
    readonly measurements: readonly Measurement[];
    readonly vaccinations: readonly Vaccination[];
    readonly healthEntries?: readonly HealthEntry[];
  },
  childId: string,
  filter: TimelineFilter = "all",
  locale: Locale = "vi",
  today = "9999-12-31",
): TimelineMonth[] {
  const t = translator(locale);
  const events: TimelineEvent[] = [];

  if (filter === "all" || filter === "milestone") {
    for (const m of input.milestones) {
      events.push({
        id: `m-${m.id}`,
        kind: "milestone",
        date: m.happenedOn,
        title: m.title,
        detail: m.note,
        href: `/child/milestones/${m.id}/edit?child=${childId}`,
        milestoneKind: m.kind,
      });
    }
  }
  if (filter === "all" || filter === "health") {
    for (const e of input.healthEntries ?? []) {
      events.push({
        id: `h-${e.id}`,
        kind: "health",
        date: e.startedOn,
        title: e.title,
        detail: `${healthKindLabel(e.kind, locale)} · ${entryPeriod(e, today, locale)}`,
        href: `/health/${e.id}/edit?child=${childId}`,
      });
    }
  }
  if (filter === "all" || filter === "measurement") {
    for (const m of input.measurements) {
      const parts = [
        m.weightG === null ? null : `${formatNumber(m.weightG / 1000, 2, locale)} kg`,
        m.lengthMm === null ? null : `${formatNumber(m.lengthMm / 10, 1, locale)} cm`,
        m.headMm === null
          ? null
          : t("timeline.head", { value: formatNumber(m.headMm / 10, 1, locale) }),
      ].filter((p): p is string => p !== null);
      events.push({
        id: `w-${m.id}`,
        kind: "measurement",
        date: m.measuredOn,
        title: t("timeline.measured"),
        detail: parts.join(" · "),
        href: null,
      });
    }
  }
  if (filter === "all" || filter === "dose") {
    for (const v of input.vaccinations) {
      events.push({
        id: `v-${v.id}`,
        kind: "dose",
        date: v.givenOn,
        title: `${productName(v.productCode, CATALOG)} · ${t("common.dose", { n: v.doseNo })}`,
        detail: productDiseases(v.productCode, locale) || null,
        href: null,
      });
    }
  }

  // Milestones first on a shared day: they are what the family chose to remember.
  const order: Record<TimelineKind, number> = { milestone: 0, health: 1, measurement: 2, dose: 3 };
  events.sort((a, b) => b.date.localeCompare(a.date) || order[a.kind] - order[b.kind]);

  const months: TimelineMonth[] = [];
  for (const e of events) {
    const month = e.date.slice(0, 7);
    const last = months.at(-1);
    if (last?.month === month) (last.events as TimelineEvent[]).push(e);
    else months.push({ month, events: [e] });
  }
  return months;
}
