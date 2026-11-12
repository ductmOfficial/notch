import type { MessageKey } from "./i18n/messages";
import {
  ageInDays,
  bmi,
  curveValue,
  type Indicator,
  MAX_AGE_DAYS,
  percentile,
  type Sex,
  zScore,
} from "@notch/growth";

export type ChartIndicator = "weight" | "length" | "bmi" | "head";

export interface MeasurementInput {
  readonly measuredOn: string;
  readonly weightG: number | null;
  readonly lengthMm: number | null;
  readonly headMm: number | null;
  readonly weightEstimated: boolean;
  readonly lengthEstimated: boolean;
  readonly headEstimated: boolean;
}

interface IndicatorInfo {
  readonly who: Indicator;
  readonly labelKey: MessageKey;
  readonly unit: string;
  readonly digits: number;
  readonly value: (m: MeasurementInput) => number | null;
  /** Whether the value was written as approximate. */
  readonly estimated: (m: MeasurementInput) => boolean;
}

export const INDICATORS: Record<ChartIndicator, IndicatorInfo> = {
  weight: {
    who: "weight-for-age",
    labelKey: "indicator.weight",
    unit: "kg",
    digits: 2,
    value: (m) => (m.weightG === null ? null : m.weightG / 1000),
    estimated: (m) => m.weightEstimated,
  },
  length: {
    who: "length-height-for-age",
    labelKey: "indicator.length",
    unit: "cm",
    digits: 1,
    value: (m) => (m.lengthMm === null ? null : m.lengthMm / 10),
    estimated: (m) => m.lengthEstimated,
  },
  bmi: {
    who: "bmi-for-age",
    labelKey: "indicator.bmi",
    unit: "kg/m²",
    digits: 1,
    value: (m) =>
      m.weightG === null || m.lengthMm === null ? null : bmi(m.weightG / 1000, m.lengthMm / 10),
    estimated: (m) => m.weightEstimated || m.lengthEstimated,
  },
  head: {
    who: "head-circumference-for-age",
    labelKey: "indicator.head",
    unit: "cm",
    digits: 1,
    value: (m) => (m.headMm === null ? null : m.headMm / 10),
    estimated: (m) => m.headEstimated,
  },
};

export function isChartIndicator(value: unknown): value is ChartIndicator {
  return typeof value === "string" && Object.hasOwn(INDICATORS, value);
}

export interface ChartPoint {
  readonly date: string;
  readonly ageDays: number;
  readonly value: number;
  readonly z: number | undefined;
  readonly percentile: number | undefined;
  readonly estimated: boolean;
}

export interface Curve {
  readonly z: number;
  readonly points: readonly (readonly [ageDays: number, value: number])[];
}

export interface ChartModel {
  readonly indicator: ChartIndicator;
  readonly maxAgeDays: number;
  readonly yMin: number;
  readonly yMax: number;
  readonly xTicks: readonly { readonly ageDays: number; readonly months: number }[];
  readonly yTicks: readonly number[];
  readonly curves: readonly Curve[];
  readonly points: readonly ChartPoint[];
}

export const CURVE_Z = [-3, -2, 0, 2, 3] as const;
const DAYS_PER_MONTH = 30.4375;
const SAMPLE_DAYS = 7;

/** Points for one indicator, oldest first; measurements without that value are skipped. */
export function chartPoints(
  indicator: ChartIndicator,
  sex: Sex,
  birthDate: string,
  measurements: readonly MeasurementInput[],
): ChartPoint[] {
  const info = INDICATORS[indicator];
  return measurements
    .flatMap((m) => {
      const value = info.value(m);
      if (value === null) return [];
      const age = ageInDays(birthDate, m.measuredOn);
      const z = zScore(info.who, sex, age, value);
      return [
        {
          date: m.measuredOn,
          ageDays: age,
          value,
          z,
          percentile: z === undefined ? undefined : percentile(z),
          estimated: info.estimated(m),
        },
      ];
    })
    .toSorted((a, b) => a.ageDays - b.ageDays);
}

/** A "nice" tick step (1, 2 or 5 × 10ⁿ) giving about `target` ticks. */
export function niceStep(range: number, target = 6): number {
  const raw = range / target;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw);
  return step ?? 10 * magnitude;
}

/**
 * Everything the chart needs, in data units: the x range covers the child's
 * measurements plus about two months (at least six months, at most five
 * years), and the y range covers the reference curves and the points.
 */
export function buildChart(
  indicator: ChartIndicator,
  sex: Sex,
  birthDate: string,
  measurements: readonly MeasurementInput[],
): ChartModel {
  const points = chartPoints(indicator, sex, birthDate, measurements);
  const lastAge = points.at(-1)?.ageDays ?? 0;
  const months = Math.min(60, Math.max(6, Math.ceil((lastAge + 60) / DAYS_PER_MONTH)));
  const maxAgeDays = Math.min(MAX_AGE_DAYS, Math.round(months * DAYS_PER_MONTH));

  const who = INDICATORS[indicator].who;
  const ages: number[] = [];
  for (let day = 0; day < maxAgeDays; day += SAMPLE_DAYS) ages.push(day);
  ages.push(maxAgeDays);
  const curves = CURVE_Z.map((z) => ({
    z,
    points: ages.flatMap((age) => {
      const value = curveValue(who, sex, age, z);
      return value === undefined ? [] : [[age, value] as const];
    }),
  }));

  const values = [
    ...curves.flatMap((c) => c.points.map(([, v]) => v)),
    ...points.map((p) => p.value),
  ];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const step = niceStep(hi - lo);
  const yMin = Math.floor(lo / step) * step;
  const yMax = Math.ceil(hi / step) * step;
  const yTicks: number[] = [];
  for (let v = yMin; v <= yMax + step / 2; v += step) yTicks.push(Number(v.toFixed(6)));

  const monthStep = months <= 12 ? 1 : months <= 24 ? 3 : 6;
  const xTicks: { ageDays: number; months: number }[] = [];
  for (let m = 0; m <= months; m += monthStep) {
    xTicks.push({ ageDays: Math.min(maxAgeDays, Math.round(m * DAYS_PER_MONTH)), months: m });
  }

  return { indicator, maxAgeDays, yMin, yMax, xTicks, yTicks, curves, points };
}
