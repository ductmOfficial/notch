import { describe, expect, it } from "vitest";

import { getLms, MAX_AGE_DAYS } from "./lms.js";
import type { Indicator, Sex } from "./types.js";
import { curveValue, valueAtZ, zFromLms, zScore } from "./zscore.js";

/** WHO monthly tables use age in days = round(months × 30.4375). */
const month = (m: number) => Math.round(m * 30.4375);

// Published WHO Child Growth Standards tables (values rounded to 0.1).
const PUBLISHED: [Indicator, Sex, number, number, number, number][] = [
  // indicator, sex, age in days, -2 SD, median, +2 SD
  ["weight-for-age", "male", 0, 2.5, 3.3, 4.4],
  ["weight-for-age", "female", 0, 2.4, 3.2, 4.2],
  ["weight-for-age", "male", month(12), 7.7, 9.6, 12.0],
  ["weight-for-age", "female", month(12), 7.0, 8.9, 11.5],
  ["length-height-for-age", "male", 0, 46.1, 49.9, 53.7],
  ["length-height-for-age", "female", 0, 45.4, 49.1, 52.9],
  ["head-circumference-for-age", "male", 0, 31.9, 34.5, 37.0],
  ["head-circumference-for-age", "female", 0, 31.5, 33.9, 36.2],
];

describe("published WHO reference values", () => {
  it.each(PUBLISHED)("%s, %s, day %i", (indicator, sex, day, minus2, median, plus2) => {
    expect(curveValue(indicator, sex, day, -2)).toBeCloseTo(minus2, 1);
    expect(curveValue(indicator, sex, day, 0)).toBeCloseTo(median, 1);
    expect(curveValue(indicator, sex, day, 2)).toBeCloseTo(plus2, 1);
  });

  it("switches from length to height at 24 months", () => {
    expect(curveValue("length-height-for-age", "male", 730, 0)).toBeCloseTo(87.8, 1);
    expect(curveValue("length-height-for-age", "male", month(24), 0)).toBeCloseTo(87.1, 1);
  });

  it("gives z = 0 at the median", () => {
    expect(zScore("weight-for-age", "male", 0, 3.3464)).toBeCloseTo(0, 6);
  });
});

describe("zScore", () => {
  it("round-trips through curveValue for every indicator and sex", () => {
    const indicators: Indicator[] = [
      "weight-for-age",
      "length-height-for-age",
      "head-circumference-for-age",
      "bmi-for-age",
    ];
    for (const indicator of indicators) {
      for (const sex of ["male", "female"] as const) {
        for (const day of [0, 100, 731, MAX_AGE_DAYS]) {
          for (const z of [-2.5, -1, 0, 1.5, 2.9]) {
            const value = curveValue(indicator, sex, day, z);
            expect(value).toBeDefined();
            expect(zScore(indicator, sex, day, value ?? 0)).toBeCloseTo(z, 6);
          }
        }
      }
    }
  });

  it("returns undefined outside 0–5 years", () => {
    expect(zScore("weight-for-age", "male", -1, 3)).toBeUndefined();
    expect(zScore("weight-for-age", "male", MAX_AGE_DAYS + 1, 18)).toBeUndefined();
    expect(curveValue("weight-for-age", "male", MAX_AGE_DAYS + 1, 0)).toBeUndefined();
  });

  it("returns undefined for non-positive or non-numeric values", () => {
    expect(zScore("weight-for-age", "male", 10, 0)).toBeUndefined();
    expect(zScore("weight-for-age", "male", 10, Number.NaN)).toBeUndefined();
  });

  it("rounds the age to the nearest day", () => {
    expect(getLms("weight-for-age", "female", 99.6)).toEqual(
      getLms("weight-for-age", "female", 100),
    );
  });
});

describe("restricted extrapolation beyond ±3 SD", () => {
  const lms = getLms("weight-for-age", "male", month(12));
  if (!lms) throw new Error("missing LMS");
  const sd2 = valueAtZ(lms, 2);
  const sd3 = valueAtZ(lms, 3);
  const sdMinus2 = valueAtZ(lms, -2);
  const sdMinus3 = valueAtZ(lms, -3);

  it("extends linearly above +3 SD using the 2–3 SD distance", () => {
    expect(zScore("weight-for-age", "male", month(12), sd3 + (sd3 - sd2))).toBeCloseTo(4, 10);
  });

  it("extends linearly below -3 SD using the 2–3 SD distance", () => {
    expect(
      zScore("weight-for-age", "male", month(12), sdMinus3 - (sdMinus2 - sdMinus3)),
    ).toBeCloseTo(-4, 10);
  });

  it("is not applied to length/height", () => {
    const lengthLms = getLms("length-height-for-age", "male", month(12));
    if (!lengthLms) throw new Error("missing LMS");
    const value = valueAtZ(lengthLms, 4);
    expect(zScore("length-height-for-age", "male", month(12), value)).toBeCloseTo(4, 10);
  });
});

describe("L = 0 (log-normal case)", () => {
  const lms = { l: 0, m: 10, s: 0.1 };

  it("uses the log-normal formulas", () => {
    expect(valueAtZ(lms, 1)).toBeCloseTo(10 * Math.exp(0.1), 10);
    expect(zFromLms(lms, 10 * Math.exp(0.2), false)).toBeCloseTo(2, 10);
  });
});
