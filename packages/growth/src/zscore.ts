import { getLms } from "./lms.js";
import type { Indicator, Lms, Sex } from "./types.js";

/**
 * Weight-based indicators use WHO's restricted extrapolation beyond ±3 SD,
 * because their distributions are skewed and the LMS curve overstates the
 * tails. Length/height and head circumference use the plain LMS formula.
 */
const RESTRICTED: ReadonlySet<Indicator> = new Set(["weight-for-age", "bmi-for-age"]);

/** Measurement at a given z-score: M · (1 + L·S·z)^(1/L). */
export function valueAtZ({ l, m, s }: Lms, z: number): number {
  if (l === 0) return m * Math.exp(s * z);
  return m * (1 + l * s * z) ** (1 / l);
}

function rawZ({ l, m, s }: Lms, value: number): number {
  if (l === 0) return Math.log(value / m) / s;
  return ((value / m) ** l - 1) / (l * s);
}

/** Z-score from LMS parameters, applying restricted extrapolation when asked. */
export function zFromLms(lms: Lms, value: number, restricted: boolean): number {
  const z = rawZ(lms, value);
  if (!restricted || Math.abs(z) <= 3) return z;
  if (z > 3) {
    const sd3 = valueAtZ(lms, 3);
    return 3 + (value - sd3) / (sd3 - valueAtZ(lms, 2));
  }
  const sd3 = valueAtZ(lms, -3);
  return -3 + (value - sd3) / (valueAtZ(lms, -2) - sd3);
}

/**
 * WHO z-score for a measurement, or `undefined` when the age is outside
 * 0–5 years or the value is not a positive number.
 *
 * Units follow the WHO tables: kg, cm, kg/m². For length/height, pass a value
 * already adjusted with {@link adjustLengthHeight}.
 */
export function zScore(
  indicator: Indicator,
  sex: Sex,
  ageDays: number,
  value: number,
): number | undefined {
  if (!Number.isFinite(value) || value <= 0) return undefined;
  const lms = getLms(indicator, sex, ageDays);
  if (!lms) return undefined;
  return zFromLms(lms, value, RESTRICTED.has(indicator));
}

/** Measurement on a reference curve (e.g. z = -2, 0, 2) for charts. */
export function curveValue(
  indicator: Indicator,
  sex: Sex,
  ageDays: number,
  z: number,
): number | undefined {
  const lms = getLms(indicator, sex, ageDays);
  return lms ? valueAtZ(lms, z) : undefined;
}
