import { getLms } from "./lms.js";
import type { Indicator, Sex } from "./types.js";
import { valueAtZ } from "./zscore.js";

/**
 * How a z-score reads on the WHO Child Growth Standards, following WHO's "Interpreting
 * growth indicators" (Training Course on Child Growth Assessment, 2008). Head circumference
 * has no named problem there; outside ±2 SD it is flagged for a doctor to look at.
 */
export type GrowthStatus =
  | "normal"
  // length/height-for-age
  | "severely-stunted"
  | "stunted"
  | "very-tall"
  // weight-for-age
  | "severely-underweight"
  | "underweight"
  | "check-bmi"
  // BMI-for-age
  | "severely-wasted"
  | "wasted"
  | "risk-of-overweight"
  | "overweight"
  | "obese"
  // head circumference-for-age
  | "head-small"
  | "head-large";

/**
 * What the status asks of the parents: nothing ("normal"), a closer look at the next
 * measurements ("watch"), or a visit to the doctor ("doctor").
 */
export type GrowthLevel = "normal" | "watch" | "doctor";

export interface Assessment {
  readonly status: GrowthStatus;
  readonly level: GrowthLevel;
}

interface Band {
  /**
   * Where the band starts. WHO's "below −2" means z < −2 and "above 2" means z > 2, so a
   * negative bound is inclusive and a positive one exclusive: −2 and +2 both read as normal.
   */
  readonly above: number;
  readonly status: GrowthStatus;
  readonly level: GrowthLevel;
}

/** Bands from the lowest z-scores up. */
const BANDS: Record<Indicator, readonly Band[]> = {
  "length-height-for-age": [
    { above: -Infinity, status: "severely-stunted", level: "doctor" },
    { above: -3, status: "stunted", level: "doctor" },
    { above: -2, status: "normal", level: "normal" },
    // Rarely a problem; WHO suggests a referral only with signs of a hormonal cause.
    { above: 3, status: "very-tall", level: "watch" },
  ],
  "weight-for-age": [
    { above: -Infinity, status: "severely-underweight", level: "doctor" },
    { above: -3, status: "underweight", level: "doctor" },
    { above: -2, status: "normal", level: "normal" },
    // Weight-for-age cannot tell a heavy child from a tall one: BMI-for-age decides.
    { above: 1, status: "check-bmi", level: "watch" },
  ],
  "bmi-for-age": [
    { above: -Infinity, status: "severely-wasted", level: "doctor" },
    { above: -3, status: "wasted", level: "doctor" },
    { above: -2, status: "normal", level: "normal" },
    { above: 1, status: "risk-of-overweight", level: "watch" },
    { above: 2, status: "overweight", level: "doctor" },
    { above: 3, status: "obese", level: "doctor" },
  ],
  "head-circumference-for-age": [
    { above: -Infinity, status: "head-small", level: "doctor" },
    { above: -2, status: "normal", level: "normal" },
    { above: 2, status: "head-large", level: "doctor" },
  ],
};

/** The WHO reading of a z-score for one indicator. */
export function assess(indicator: Indicator, z: number): Assessment {
  if (Number.isNaN(z)) throw new RangeError("z-score is not a number");
  const band = BANDS[indicator].findLast((b) => (b.above < 0 ? z >= b.above : z > b.above));
  if (!band) throw new RangeError(`No band for z = ${String(z)}`);
  return { status: band.status, level: band.level };
}

/** The z-scores between which an indicator reads as normal. */
export function normalZ(indicator: Indicator): { readonly low: number; readonly high: number } {
  const bands = BANDS[indicator];
  const i = bands.findIndex((b) => b.status === "normal");
  return { low: bands[i]?.above ?? -2, high: bands[i + 1]?.above ?? Infinity };
}

export interface NormalRange {
  /** Lowest normal value, in the indicator's unit (kg, cm, kg/m²). */
  readonly low: number;
  readonly median: number;
  /** Highest normal value. */
  readonly high: number;
}

/** The normal range of an indicator at a given age, in its unit; undefined beyond 5 years. */
export function normalRange(
  indicator: Indicator,
  sex: Sex,
  ageDays: number,
): NormalRange | undefined {
  const lms = getLms(indicator, sex, ageDays);
  if (!lms) return undefined;
  const { low, high } = normalZ(indicator);
  return { low: valueAtZ(lms, low), median: lms.m, high: valueAtZ(lms, high) };
}

/** Change in z-score between two measurements that, WHO notes, deserves a doctor's look. */
export const NOTABLE_Z_CHANGE = 1;

export type Trend = "steady" | "falling" | "rising";

/**
 * Direction of the z-score between two measurements. A drop or a rise of a whole
 * standard deviation crosses at least one line of the chart, which WHO treats as a sign
 * to look into even while the child stays within the normal range.
 */
export function trend(previousZ: number, latestZ: number): Trend {
  const change = latestZ - previousZ;
  if (change <= -NOTABLE_Z_CHANGE) return "falling";
  if (change >= NOTABLE_Z_CHANGE) return "rising";
  return "steady";
}
