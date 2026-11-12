import { fromDayNumber, toDayNumber } from "./dates.js";
import type { DosePlan, DoseState, PlanOptions, Schedule, Vaccination } from "./types.js";

const key = (code: string, doseNo: number) => `${code}#${String(doseNo)}`;

/**
 * Works out the state of every dose in the schedule for one child on a given
 * day. Doses of the same vaccine are evaluated in order, so the earliest date
 * of a dose depends on when the previous one was actually given.
 */
export function planDoses(
  schedule: Schedule,
  birthDate: string,
  vaccinations: readonly Vaccination[],
  today: string,
  options: PlanOptions = {},
): DoseState[] {
  const { upcomingWindowDays = 30, overdueAfterDays = 30 } = options;
  const birth = toDayNumber(birthDate);
  const now = toDayNumber(today);
  const given = new Map(vaccinations.map((v) => [key(v.vaccineCode, v.doseNo), v.givenOn]));

  const ordered = schedule.doses
    .map((dose, index) => ({ dose, index }))
    .toSorted(
      (a, b) =>
        a.dose.vaccineCode.localeCompare(b.dose.vaccineCode) || a.dose.doseNo - b.dose.doseNo,
    );
  const states = new Map<string, DoseState>();
  const result: DoseState[] = [];

  for (const { dose, index } of ordered) {
    const givenOn = given.get(key(dose.vaccineCode, dose.doseNo));
    const previous =
      dose.doseNo > 1 ? states.get(key(dose.vaccineCode, dose.doseNo - 1)) : undefined;
    const state = evaluate(dose, givenOn, previous);
    states.set(key(dose.vaccineCode, dose.doseNo), state);
    result[index] = state;
  }

  function evaluate(
    dose: DosePlan,
    givenOn: string | undefined,
    previous: DoseState | undefined,
  ): DoseState {
    const base = { vaccineCode: dose.vaccineCode, doseNo: dose.doseNo, givenOn };
    const previousGiven = previous?.givenOn;

    if (dose.doseNo > 1 && previousGiven === undefined && givenOn === undefined) {
      return { ...base, status: "waiting", dueOn: undefined, earliestOn: undefined };
    }

    let earliest = birth + (dose.minAgeDays ?? dose.recommendedAgeDays);
    if (previousGiven !== undefined) {
      earliest = Math.max(earliest, toDayNumber(previousGiven) + (dose.minIntervalDays ?? 0));
    }
    const due = Math.max(birth + dose.recommendedAgeDays, earliest);
    const dates = { dueOn: fromDayNumber(due), earliestOn: fromDayNumber(earliest) };

    if (givenOn !== undefined) return { ...base, ...dates, status: "done" };
    if (dose.maxAgeDays !== undefined && now > birth + dose.maxAgeDays)
      return { ...base, ...dates, status: "missed" };
    if (now < earliest) {
      return {
        ...base,
        ...dates,
        status: earliest - now <= upcomingWindowDays ? "upcoming" : "scheduled",
      };
    }
    return { ...base, ...dates, status: now > due + overdueAfterDays ? "overdue" : "due" };
  }

  return result;
}

const ACTIONABLE = new Set(["overdue", "due", "upcoming", "scheduled"]);

/** The dose to show on the Today screen: the earliest-due actionable dose. */
export function nextDose(states: readonly DoseState[]): DoseState | undefined {
  return states
    .filter((s) => ACTIONABLE.has(s.status) && s.dueOn !== undefined)
    .toSorted((a, b) => (a.dueOn ?? "").localeCompare(b.dueOn ?? ""))[0];
}
