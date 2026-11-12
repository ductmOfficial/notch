import { describe, expect, it } from "vitest";

import { buildChart, chartPoints, isChartIndicator, niceStep } from "./growth-chart";

// Fixture only; not anyone's real measurements.
const BIRTH = "2030-01-01";
const MEASUREMENTS = [
  {
    measuredOn: "2030-04-01",
    weightG: 6000,
    lengthMm: 610,
    headMm: null,
    weightEstimated: true,
    lengthEstimated: false,
    headEstimated: false,
  },
  {
    measuredOn: "2030-02-01",
    weightG: 4400,
    lengthMm: 550,
    headMm: 370,
    weightEstimated: false,
    lengthEstimated: false,
    headEstimated: false,
  },
  {
    measuredOn: "2030-03-01",
    weightG: null,
    lengthMm: 580,
    headMm: null,
    weightEstimated: false,
    lengthEstimated: false,
    headEstimated: false,
  },
];

describe("chartPoints", () => {
  it("sorts by age and skips measurements without the value", () => {
    const points = chartPoints("weight", "female", BIRTH, MEASUREMENTS);
    expect(points.map((p) => [p.date, p.ageDays, p.value, p.estimated])).toEqual([
      ["2030-02-01", 31, 4.4, false],
      ["2030-04-01", 90, 6, true],
    ]);
    expect(points[0]?.z).toBeDefined();
    expect(points[0]?.percentile).toBeGreaterThan(0);
  });

  it("flags each value separately; BMI inherits either flag", () => {
    expect(chartPoints("length", "female", BIRTH, MEASUREMENTS).map((p) => p.estimated)).toEqual([
      false,
      false,
      false,
    ]);
    expect(chartPoints("bmi", "female", BIRTH, MEASUREMENTS).map((p) => p.estimated)).toEqual([
      false,
      true,
    ]);
    expect(chartPoints("head", "female", BIRTH, MEASUREMENTS).map((p) => p.estimated)).toEqual([
      false,
    ]);
  });

  it("computes BMI only when weight and length exist", () => {
    expect(chartPoints("bmi", "female", BIRTH, MEASUREMENTS)).toHaveLength(2);
    expect(chartPoints("head", "female", BIRTH, MEASUREMENTS)).toHaveLength(1);
  });

  it("leaves z undefined beyond five years", () => {
    const [point] = chartPoints("weight", "male", "2020-01-01", [
      {
        measuredOn: "2026-01-01",
        weightG: 20000,
        lengthMm: null,
        headMm: null,
        weightEstimated: false,
        lengthEstimated: false,
        headEstimated: false,
      },
    ]);
    expect(point?.z).toBeUndefined();
    expect(point?.percentile).toBeUndefined();
  });
});

describe("buildChart", () => {
  const chart = buildChart("weight", "female", BIRTH, MEASUREMENTS);

  it("shows at least six months", () => {
    expect(chart.maxAgeDays).toBe(183);
    expect(chart.xTicks.map((t) => t.months)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("draws five reference curves across the range", () => {
    expect(chart.curves.map((c) => c.z)).toEqual([-3, -2, 0, 2, 3]);
    for (const curve of chart.curves) {
      expect(curve.points[0]?.[0]).toBe(0);
      expect(curve.points.at(-1)?.[0]).toBe(chart.maxAgeDays);
    }
  });

  it("covers every curve and point within the y range", () => {
    const values = [
      ...chart.curves.flatMap((c) => c.points.map(([, v]) => v)),
      ...chart.points.map((p) => p.value),
    ];
    expect(Math.min(...values)).toBeGreaterThanOrEqual(chart.yMin);
    expect(Math.max(...values)).toBeLessThanOrEqual(chart.yMax);
    expect(chart.yTicks[0]).toBe(chart.yMin);
    expect(chart.yTicks.at(-1)).toBe(chart.yMax);
  });

  it("widens the range and the tick step for older children", () => {
    const older = buildChart("length", "male", "2028-01-01", [
      {
        measuredOn: "2029-07-01",
        weightG: null,
        lengthMm: 820,
        headMm: null,
        weightEstimated: false,
        lengthEstimated: false,
        headEstimated: false,
      },
    ]);
    expect(older.xTicks[1]?.months).toBe(3);
    const oldest = buildChart("length", "male", "2026-01-01", [
      {
        measuredOn: "2030-12-01",
        weightG: null,
        lengthMm: 1080,
        headMm: null,
        weightEstimated: false,
        lengthEstimated: false,
        headEstimated: false,
      },
    ]);
    expect(oldest.maxAgeDays).toBe(1826);
    expect(oldest.xTicks[1]?.months).toBe(6);
  });

  it("works without measurements", () => {
    expect(buildChart("head", "male", BIRTH, []).points).toEqual([]);
  });
});

describe("helpers", () => {
  it("picks 1, 2 or 5 × 10ⁿ steps", () => {
    expect(niceStep(10)).toBe(2);
    expect(niceStep(3)).toBe(0.5);
    expect(niceStep(55)).toBe(10);
    expect(niceStep(9.5, 1)).toBe(10);
  });

  it("recognises indicator names", () => {
    expect(isChartIndicator("weight")).toBe(true);
    expect(isChartIndicator("toString")).toBe(false);
    expect(isChartIndicator(undefined)).toBe(false);
  });
});
