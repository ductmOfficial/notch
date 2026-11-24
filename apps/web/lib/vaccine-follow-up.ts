import type { Temperature, Vaccination } from "@notch/db";

import { vietnamDateTime } from "./health-view";

/** Days after a dose (0 is the day itself) during which Today suggests taking temperatures. */
export const FOLLOW_UP_DAYS = 2;

export interface FollowUp {
  /** The day of the latest doses, YYYY-MM-DD. */
  readonly givenOn: string;
  /** 0 on the day of the doses, then 1 and 2. */
  readonly day: number;
  /** Every dose given that day. */
  readonly doses: readonly Vaccination[];
  /** Readings taken since that day, newest first. */
  readonly readings: readonly Temperature[];
}

const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

/**
 * The follow-up after the latest doses, while it lasts: from the day of the doses to two days
 * later. Mild fever and soreness are common in the first one or two days after a vaccine, so
 * the family is asked to take the temperature and write it down. Undefined otherwise.
 *
 * `vaccinations` oldest first and `temperatures` oldest first, as the queries return them.
 */
export function vaccineFollowUp(
  vaccinations: readonly Vaccination[],
  temperatures: readonly Temperature[],
  today: string,
): FollowUp | undefined {
  const latest = vaccinations
    .map((v) => v.givenOn)
    .reduce<string | undefined>((max, d) => (max === undefined || d > max ? d : max), undefined);
  if (latest === undefined) return undefined;
  const day = daysBetween(latest, today);
  if (day < 0 || day > FOLLOW_UP_DAYS) return undefined;
  return {
    givenOn: latest,
    day,
    doses: vaccinations.filter((v) => v.givenOn === latest),
    readings: [...temperatures]
      .filter((r) => vietnamDateTime(r.measuredAt).date >= latest)
      .reverse(),
  };
}
