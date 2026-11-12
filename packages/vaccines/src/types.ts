export interface Vaccine {
  /** Stable identifier, e.g. "bcg". */
  readonly code: string;
  readonly name: string;
  /** National expanded programme (TCMR, free) or a paid service vaccine. */
  readonly program: "tcmr" | "service";
}

export interface DosePlan {
  readonly vaccineCode: string;
  /** 1-based, contiguous per vaccine. */
  readonly doseNo: number;
  /** Age at which the dose is recommended. */
  readonly recommendedAgeDays: number;
  /** Youngest age at which the dose is valid. Defaults to the recommended age. */
  readonly minAgeDays?: number;
  /** Shortest gap after the previous dose of the same vaccine. */
  readonly minIntervalDays?: number;
  /** Oldest age at which the dose is still given; after that it is missed. */
  readonly maxAgeDays?: number;
}

export interface Schedule {
  readonly vaccines: readonly Vaccine[];
  readonly doses: readonly DosePlan[];
}

/** A dose the child has received. Dates are calendar dates, YYYY-MM-DD. */
export interface Vaccination {
  readonly vaccineCode: string;
  readonly doseNo: number;
  readonly givenOn: string;
}

export type DoseStatus =
  /** Recorded as given. */
  | "done"
  /** Valid now and not yet late. */
  | "due"
  /** Past the due date by more than the grace period. */
  | "overdue"
  /** Not valid yet, but within the upcoming window. */
  | "upcoming"
  /** Not valid yet, further away than the upcoming window. */
  | "scheduled"
  /** The previous dose of the same vaccine has not been given. */
  | "waiting"
  /** Older than the maximum age for this dose. */
  | "missed";

export interface DoseState {
  readonly vaccineCode: string;
  readonly doseNo: number;
  readonly status: DoseStatus;
  /** Recommended date, never earlier than `earliestOn`. Undefined while waiting. */
  readonly dueOn: string | undefined;
  /** First date on which the dose is valid. Undefined while waiting. */
  readonly earliestOn: string | undefined;
  readonly givenOn: string | undefined;
}

export interface PlanOptions {
  /** Days before the earliest date that count as "upcoming". Default 30. */
  readonly upcomingWindowDays?: number;
  /** Days after the due date before a dose is "overdue". Default 30. */
  readonly overdueAfterDays?: number;
}
