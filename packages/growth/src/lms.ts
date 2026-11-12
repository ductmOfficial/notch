import { bmiForAge } from "./data/bmi-for-age.js";
import { headCircumferenceForAge } from "./data/head-circumference-for-age.js";
import { lengthHeightForAge } from "./data/length-height-for-age.js";
import { weightForAge } from "./data/weight-for-age.js";
import type { Indicator, Lms, LmsTable, Sex } from "./types.js";

/** Oldest age covered by the WHO Child Growth Standards (5 years). */
export const MAX_AGE_DAYS = 1826;

const TABLES: Record<Indicator, LmsTable> = {
  "weight-for-age": weightForAge,
  "length-height-for-age": lengthHeightForAge,
  "head-circumference-for-age": headCircumferenceForAge,
  "bmi-for-age": bmiForAge,
};

/**
 * LMS parameters for an indicator at a whole day of age, or `undefined`
 * outside 0–1826 days. Ages are rounded to the nearest day, as WHO does.
 */
export function getLms(indicator: Indicator, sex: Sex, ageDays: number): Lms | undefined {
  const day = Math.round(ageDays);
  if (!Number.isFinite(day) || day < 0 || day > MAX_AGE_DAYS) return undefined;
  const values = TABLES[indicator][sex];
  const l = values[day * 3];
  const m = values[day * 3 + 1];
  const s = values[day * 3 + 2];
  if (l === undefined || m === undefined || s === undefined) return undefined;
  return { l, m, s };
}
