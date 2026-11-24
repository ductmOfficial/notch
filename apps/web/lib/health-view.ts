import type { HealthEntry, Temperature } from "@notch/db";

import { ageInMonths, formatDate, formatNumber } from "./format";
import { type Locale, type MessageKey, translator } from "./i18n/messages";

export type HealthKind = HealthEntry["kind"];
export const HEALTH_KINDS: readonly HealthKind[] = ["illness", "medication", "visit"];

const KIND_LABELS: Record<HealthKind, MessageKey> = {
  illness: "health.kindIllness",
  medication: "health.kindMedication",
  visit: "health.kindVisit",
};

export const healthKindLabel = (kind: HealthKind, locale: Locale): string =>
  translator(locale)(KIND_LABELS[kind]);

// ── Temperatures ─────────────────────────────────────────────────────────

/**
 * How a reading compares with the usual thresholds for children: a fever from 38.0 °C, a high
 * one from 39.0 °C. Below 36.0 °C usually means the reading should be taken again.
 */
export type TemperatureLevel = "low" | "normal" | "warm" | "fever" | "high";

export function temperatureLevel(tenthsC: number): TemperatureLevel {
  if (tenthsC < 360) return "low";
  if (tenthsC < 375) return "normal";
  if (tenthsC < 380) return "warm";
  if (tenthsC < 390) return "fever";
  return "high";
}

const LEVEL_LABELS: Record<TemperatureLevel, MessageKey> = {
  low: "health.levelLow",
  normal: "health.levelNormal",
  warm: "health.levelWarm",
  fever: "health.levelFever",
  high: "health.levelHigh",
};

/** Badge tone for a level: green when normal, amber to watch, red for a fever. */
export const LEVEL_TONE: Record<TemperatureLevel, "done" | "soon" | "overdue"> = {
  low: "soon",
  normal: "done",
  warm: "soon",
  fever: "overdue",
  high: "overdue",
};

export const temperatureLevelLabel = (level: TemperatureLevel, locale: Locale): string =>
  translator(locale)(LEVEL_LABELS[level]);

export function formatTemperature(tenthsC: number, locale: Locale = "vi"): string {
  return `${formatNumber(tenthsC / 10, 1, locale)} °C`;
}

/**
 * What to do about a reading, never a diagnosis: a baby under three months with a fever
 * should be seen at once (the usual paediatric advice); otherwise watch and ask a doctor.
 */
export function temperatureAdvice(
  tenthsC: number,
  birthDate: string,
  onDate: string,
  locale: Locale = "vi",
): string | null {
  const t = translator(locale);
  const level = temperatureLevel(tenthsC);
  if (level === "low") return t("health.adviceLow");
  if (level !== "fever" && level !== "high") return null;
  if (ageInMonths(birthDate, onDate) < 3) return t("health.adviceInfant");
  return t(level === "high" ? "health.adviceHigh" : "health.adviceFever");
}

// ── Vietnam time ─────────────────────────────────────────────────────────

const VN = "Asia/Ho_Chi_Minh";

/** A moment as the date (YYYY-MM-DD) and time (HH:mm) shown in Vietnam. */
export function vietnamDateTime(at: Date): { date: string; time: string } {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: VN }).format(at);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: VN,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(at);
  return { date, time };
}

/** A date and time entered in Vietnam (UTC+7, no daylight saving) as an ISO timestamp. */
export const fromVietnam = (date: string, time: string): string => `${date}T${time}:00+07:00`;

/** "16/11/2026 21:30", in Vietnam time. */
export function formatDateTime(at: Date, locale: Locale = "vi"): string {
  const { date, time } = vietnamDateTime(at);
  return `${formatDate(date, locale)} ${time}`;
}

// ── Entries ──────────────────────────────────────────────────────────────

/** Still going on the day: no end date yet, or one today or later. */
export const isOngoing = (entry: HealthEntry, today: string): boolean =>
  entry.endedOn === null || entry.endedOn >= today;

/** "Since 12/11/2026" or "12/11/2026 – 15/11/2026" (one date when it lasted a day). */
export function entryPeriod(entry: HealthEntry, today: string, locale: Locale = "vi"): string {
  const t = translator(locale);
  const start = formatDate(entry.startedOn, locale);
  if (entry.endedOn === null || entry.endedOn > today) return t("health.since", { date: start });
  if (entry.endedOn === entry.startedOn) return start;
  return `${start} – ${formatDate(entry.endedOn, locale)}`;
}

export interface HealthOverview {
  /** Entries still going on, the most recent first. */
  readonly ongoing: readonly HealthEntry[];
  /** Entries that ended, the most recent first. */
  readonly past: readonly HealthEntry[];
  /** The latest reading, when there is one. */
  readonly latest: Temperature | undefined;
  /** Readings of the last 48 hours, newest first. */
  readonly recent: readonly Temperature[];
}

/** `entries` newest first, `temperatures` oldest first, as the queries return them. */
export function healthOverview(
  entries: readonly HealthEntry[],
  temperatures: readonly Temperature[],
  today: string,
  now: Date = new Date(),
): HealthOverview {
  const since = now.getTime() - 48 * 3600 * 1000;
  const newestFirst = [...temperatures].reverse();
  return {
    ongoing: entries.filter((e) => isOngoing(e, today)),
    past: entries.filter((e) => !isOngoing(e, today)),
    latest: newestFirst[0],
    recent: newestFirst.filter((r) => r.measuredAt.getTime() >= since),
  };
}

/** Readings grouped by their day in Vietnam, newest day and reading first. */
export function readingsByDay(
  temperatures: readonly Temperature[],
): { date: string; readings: Temperature[] }[] {
  const days: { date: string; readings: Temperature[] }[] = [];
  for (const reading of [...temperatures].reverse()) {
    const { date } = vietnamDateTime(reading.measuredAt);
    const last = days.at(-1);
    if (last?.date === date) last.readings.push(reading);
    else days.push({ date, readings: [reading] });
  }
  return days;
}
