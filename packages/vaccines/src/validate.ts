import type { Schedule } from "./types.js";

/**
 * Throws if the schedule is inconsistent: unknown or duplicate vaccine codes,
 * dose numbers that are not 1..n per vaccine, or ages out of order. Run it on
 * generated schedule data before use.
 */
export function validateSchedule(schedule: Schedule): void {
  const codes = new Set<string>();
  for (const vaccine of schedule.vaccines) {
    if (codes.has(vaccine.code)) throw new Error(`Duplicate vaccine code "${vaccine.code}"`);
    codes.add(vaccine.code);
  }

  const doseNumbers = new Map<string, number[]>();
  for (const dose of schedule.doses) {
    const label = `${dose.vaccineCode} dose ${String(dose.doseNo)}`;
    if (!codes.has(dose.vaccineCode)) throw new Error(`${label}: unknown vaccine`);
    const min = dose.minAgeDays ?? dose.recommendedAgeDays;
    if (min < 0 || min > dose.recommendedAgeDays)
      throw new Error(`${label}: minimum age after recommended age`);
    if (dose.maxAgeDays !== undefined && dose.maxAgeDays < dose.recommendedAgeDays) {
      throw new Error(`${label}: maximum age before recommended age`);
    }
    if ((dose.minIntervalDays ?? 0) < 0) throw new Error(`${label}: negative interval`);
    doseNumbers.set(dose.vaccineCode, [...(doseNumbers.get(dose.vaccineCode) ?? []), dose.doseNo]);
  }

  for (const [code, numbers] of doseNumbers) {
    const sorted = numbers.toSorted((a, b) => a - b);
    sorted.forEach((n, i) => {
      if (n !== i + 1) throw new Error(`${code}: dose numbers must be 1..${String(sorted.length)}`);
    });
  }
}
