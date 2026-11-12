import type { Catalog, DiseaseCode } from "./catalog.js";
import { toDayNumber } from "./dates.js";

/** A dose of a product the child has received. */
export interface DoseRecord {
  readonly productCode: string;
  readonly doseNo: number;
  /** YYYY-MM-DD */
  readonly givenOn: string;
}

/**
 * A dose booked by the vaccination clinic, as written in the book. The date
 * can be unknown ("after the first birthday"), so `dueOn` may be null.
 */
export interface Appointment {
  readonly productCode: string;
  readonly doseNo: number;
  readonly dueOn: string | null;
  readonly note?: string | null;
}

export type AppointmentStatus = "fulfilled" | "overdue" | "today" | "upcoming" | "undated";

export interface AppointmentState extends Appointment {
  readonly status: AppointmentStatus;
  /** Days from today to the appointment; negative when overdue. */
  readonly daysUntil: number | undefined;
  /** Date the dose was given, when fulfilled. */
  readonly givenOn: string | undefined;
}

const key = (productCode: string, doseNo: number) => `${productCode}#${String(doseNo)}`;

/**
 * Status of each appointment on a given day. An appointment is fulfilled when
 * a dose with the same product and dose number has been recorded, whatever
 * its date.
 */
export function appointmentStates(
  appointments: readonly Appointment[],
  records: readonly DoseRecord[],
  today: string,
): AppointmentState[] {
  const now = toDayNumber(today);
  const given = new Map(records.map((r) => [key(r.productCode, r.doseNo), r.givenOn]));

  return appointments.map((appointment) => {
    const givenOn = given.get(key(appointment.productCode, appointment.doseNo));
    const daysUntil = appointment.dueOn === null ? undefined : toDayNumber(appointment.dueOn) - now;
    let status: AppointmentStatus;
    if (givenOn !== undefined) status = "fulfilled";
    else if (daysUntil === undefined) status = "undated";
    else if (daysUntil < 0) status = "overdue";
    else if (daysUntil === 0) status = "today";
    else status = "upcoming";
    return { ...appointment, status, daysUntil, givenOn };
  });
}

const OPEN: ReadonlySet<AppointmentStatus> = new Set(["overdue", "today", "upcoming"]);

/** The appointment to show first: overdue ones, then the soonest dated one. */
export function nextAppointment(states: readonly AppointmentState[]): AppointmentState | undefined {
  return states
    .filter((s) => OPEN.has(s.status))
    .toSorted((a, b) => (a.daysUntil ?? 0) - (b.daysUntil ?? 0))[0];
}

export interface DiseaseDose extends DoseRecord {
  readonly productName: string;
}

/**
 * Doses grouped by the diseases they protect against, in catalog order, each
 * list sorted by date. Diseases without doses are included with an empty list
 * so the screen can show every row of the book.
 */
export function dosesByDisease(
  records: readonly DoseRecord[],
  catalog: Catalog,
): Map<DiseaseCode, DiseaseDose[]> {
  const products = new Map(catalog.products.map((p) => [p.code, p]));
  const result = new Map<DiseaseCode, DiseaseDose[]>(catalog.diseases.map((d) => [d.code, []]));

  for (const record of records) {
    const product = products.get(record.productCode);
    if (!product) throw new Error(`Unknown product "${record.productCode}"`);
    for (const disease of product.diseases) {
      result.get(disease)?.push({ ...record, productName: product.name });
    }
  }
  for (const doses of result.values()) {
    doses.sort((a, b) => a.givenOn.localeCompare(b.givenOn) || a.doseNo - b.doseNo);
  }
  return result;
}
