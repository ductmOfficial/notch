export type Sex = "male" | "female";

export type Indicator =
  "weight-for-age" | "length-height-for-age" | "head-circumference-for-age" | "bmi-for-age";

/** Box-Cox power (L), median (M) and coefficient of variation (S). */
export interface Lms {
  readonly l: number;
  readonly m: number;
  readonly s: number;
}

/** Flat `[L, M, S]` triples per sex, indexed by day of age. */
export interface LmsTable {
  readonly male: readonly number[];
  readonly female: readonly number[];
}
