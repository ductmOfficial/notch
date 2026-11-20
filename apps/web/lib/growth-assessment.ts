import {
  assess,
  type GrowthLevel,
  type GrowthStatus,
  normalRange,
  type Sex,
  trend,
  type Trend,
} from "@notch/growth";

import { formatAge, formatDate, formatNumber } from "./format";
import { type ChartIndicator, type ChartPoint, INDICATORS } from "./growth-chart";
import { type Locale, type MessageKey, translator } from "./i18n/messages";

export interface GrowthReading {
  readonly status: GrowthStatus;
  /** What the status alone asks for; it colours the label. */
  readonly statusLevel: GrowthLevel;
  /** The more pressing of the status and the trend; it picks the advice. */
  readonly level: GrowthLevel;
  /** "Bình thường", "Thấp còi", …: WHO's name for the status. */
  readonly label: string;
  /** "Bình thường ở 1 tuổi 6 tháng: 8,1–11,6 kg", at the age of the measurement; undefined past five years. */
  readonly range: string | undefined;
  /** "Giảm 1,2 SD so với lần đo 27/09/2026"; undefined when steady or not comparable. */
  readonly change: string | undefined;
  /** What to do about it, without a diagnosis. */
  readonly advice: string;
}

const LABELS: Record<GrowthStatus, MessageKey> = {
  normal: "growthStatus.normal",
  "severely-stunted": "growthStatus.severelyStunted",
  stunted: "growthStatus.stunted",
  "very-tall": "growthStatus.veryTall",
  "severely-underweight": "growthStatus.severelyUnderweight",
  underweight: "growthStatus.underweight",
  "check-bmi": "growthStatus.checkBmi",
  "severely-wasted": "growthStatus.severelyWasted",
  wasted: "growthStatus.wasted",
  "risk-of-overweight": "growthStatus.riskOfOverweight",
  overweight: "growthStatus.overweight",
  obese: "growthStatus.obese",
  "head-small": "growthStatus.headSmall",
  "head-large": "growthStatus.headLarge",
};

/** Advice for the statuses that only ask for a closer look; the others share one line. */
const WATCH_ADVICE: Partial<Record<GrowthStatus, MessageKey>> = {
  "very-tall": "growthAdvice.veryTall",
  "check-bmi": "growthAdvice.checkBmi",
  "risk-of-overweight": "growthAdvice.riskOfOverweight",
};

const RANK: Record<GrowthLevel, number> = { normal: 0, watch: 1, doctor: 2 };

/**
 * How a change between two measurements weighs. A fall of a whole SD calls for a doctor for
 * every indicator; a rise matters for weight, BMI and head circumference, not for length.
 */
function trendLevel(indicator: ChartIndicator, direction: Trend): GrowthLevel {
  if (direction === "falling") return "doctor";
  if (direction === "rising") {
    if (indicator === "head") return "doctor";
    if (indicator === "weight" || indicator === "bmi") return "watch";
  }
  return "normal";
}

/**
 * Reads the latest point of an indicator against the WHO standards, with the normal range at
 * the child's age and the change since the previous measurement. Approximate values are not
 * compared, since their change says little. Undefined when the latest point has no z-score.
 */
export function readGrowth(
  indicator: ChartIndicator,
  sex: Sex,
  birthDate: string,
  points: readonly ChartPoint[],
  locale: Locale = "vi",
): GrowthReading | undefined {
  const latest = points.at(-1);
  if (latest?.z === undefined) return undefined;
  const t = translator(locale);
  const info = INDICATORS[indicator];
  const { status, level: statusLevel } = assess(info.who, latest.z);

  const bounds = normalRange(info.who, sex, latest.ageDays);
  const range =
    bounds &&
    t("growth.normalRange", {
      age: formatAge(birthDate, latest.date, locale),
      low: formatNumber(bounds.low, 1, locale),
      high: formatNumber(bounds.high, 1, locale),
      unit: info.unit,
    });

  const previous = points.slice(0, -1).findLast((p) => p.z !== undefined);
  let change: string | undefined;
  let changeLevel: GrowthLevel = "normal";
  if (previous?.z !== undefined && !previous.estimated && !latest.estimated) {
    const direction = trend(previous.z, latest.z);
    if (direction !== "steady") {
      changeLevel = trendLevel(indicator, direction);
      change = t(direction === "falling" ? "growth.fell" : "growth.rose", {
        n: formatNumber(Math.abs(latest.z - previous.z), 1, locale),
        date: formatDate(previous.date, locale),
      });
    }
  }

  const level = RANK[changeLevel] > RANK[statusLevel] ? changeLevel : statusLevel;
  const advice =
    level === "doctor"
      ? t("growthAdvice.doctor")
      : level === "watch"
        ? t(WATCH_ADVICE[status] ?? "growthAdvice.watchChange")
        : t("growthAdvice.normal");

  return { status, statusLevel, level, label: t(LABELS[status]), range, change, advice };
}
