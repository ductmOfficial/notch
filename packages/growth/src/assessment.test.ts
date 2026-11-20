import { describe, expect, it } from "vitest";

import { assess, normalRange, normalZ, trend } from "./assessment.js";
import type { Indicator } from "./types.js";

const statuses = (indicator: Indicator, zs: readonly number[]) =>
  zs.map((z) => assess(indicator, z).status);

describe("assess", () => {
  it("reads length/height-for-age as WHO does", () => {
    expect(statuses("length-height-for-age", [-3.5, -3, -2.5, -2, 0, 3, 3.1])).toEqual([
      "severely-stunted",
      "stunted",
      "stunted",
      "normal",
      "normal",
      "normal",
      "very-tall",
    ]);
  });

  it("reads weight-for-age, sending high values to BMI", () => {
    expect(statuses("weight-for-age", [-3.1, -2.1, -2, 1, 1.01, 4])).toEqual([
      "severely-underweight",
      "underweight",
      "normal",
      "normal",
      "check-bmi",
      "check-bmi",
    ]);
  });

  it("reads BMI-for-age from wasted to obese", () => {
    expect(statuses("bmi-for-age", [-3.2, -2.2, 0, 1.5, 2.5, 3.5])).toEqual([
      "severely-wasted",
      "wasted",
      "normal",
      "risk-of-overweight",
      "overweight",
      "obese",
    ]);
  });

  it("flags a head circumference outside ±2 SD", () => {
    expect(statuses("head-circumference-for-age", [-2.01, -2, 2, 2.01])).toEqual([
      "head-small",
      "normal",
      "normal",
      "head-large",
    ]);
  });

  it("asks for a doctor only where WHO names a problem", () => {
    expect(assess("bmi-for-age", 1.5).level).toBe("watch");
    expect(assess("bmi-for-age", 2.5).level).toBe("doctor");
    expect(assess("length-height-for-age", 3.5).level).toBe("watch");
    expect(assess("weight-for-age", -2.5).level).toBe("doctor");
    expect(assess("weight-for-age", 0).level).toBe("normal");
  });

  it("refuses a z-score that is not a number", () => {
    expect(() => assess("weight-for-age", Number.NaN)).toThrow(RangeError);
  });
});

describe("normalRange", () => {
  it("gives the normal band of an indicator at an age, from the WHO tables", () => {
    expect(normalZ("weight-for-age")).toEqual({ low: -2, high: 1 });
    expect(normalZ("length-height-for-age")).toEqual({ low: -2, high: 3 });
    // A girl of 18 months: WHO weight-for-age −2 SD 8.1 kg, median 10.2 kg, +1 SD 11.6 kg.
    const weight = normalRange("weight-for-age", "female", 549);
    expect(weight?.low).toBeCloseTo(8.1, 1);
    expect(weight?.median).toBeCloseTo(10.2, 1);
    expect(weight?.high).toBeCloseTo(11.6, 1);
    // Length-for-age: −2 SD 74.9 cm, +3 SD 89.5 cm.
    const length = normalRange("length-height-for-age", "female", 549);
    expect(length?.low).toBeCloseTo(74.9, 1);
    expect(length?.high).toBeCloseTo(89.5, 1);
  });

  it("has no range past five years", () => {
    expect(normalRange("weight-for-age", "male", 2000)).toBeUndefined();
  });
});

describe("trend", () => {
  it("notes a change of a whole standard deviation", () => {
    expect(trend(0.4, -0.6)).toBe("falling");
    expect(trend(0.4, -0.5)).toBe("steady");
    expect(trend(-1, 0)).toBe("rising");
  });
});
