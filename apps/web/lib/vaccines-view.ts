import {
  type Appointment,
  type AppointmentState,
  appointmentStates,
  CATALOG,
  type Catalog,
  type DiseaseCode,
  type DiseaseDose,
  dosesByDisease,
  type DoseRecord,
  nextAppointment,
} from "@notch/vaccines";

import { formatDate } from "./format";

export interface DiseaseRow {
  readonly code: DiseaseCode;
  readonly name: string;
  readonly doses: readonly DiseaseDose[];
}

export interface HistoryEntry extends DoseRecord {
  readonly productName: string;
  readonly diseases: readonly string[];
}

export interface VaccinationView {
  /** The appointment to show first: overdue ones, then the soonest. */
  readonly next: AppointmentState | undefined;
  /** Overdue, today and upcoming appointments, soonest first. */
  readonly open: readonly AppointmentState[];
  /** Booked without a date ("after the first birthday"). */
  readonly undated: readonly AppointmentState[];
  /** Diseases with at least one dose, in the order of the vaccination book. */
  readonly covered: readonly DiseaseRow[];
  /** Diseases without any dose yet. */
  readonly uncovered: readonly DiseaseRow[];
  /** Every dose, newest first. */
  readonly history: readonly HistoryEntry[];
}

export function productName(code: string, catalog: Catalog = CATALOG): string {
  return catalog.products.find((p) => p.code === code)?.name ?? code;
}

/** "Hôm nay", "Ngày mai", "Còn 14 ngày", "Quá hạn 3 ngày", "Chưa có ngày", "Đã tiêm 12/10/2026". */
export function dueLabel(state: AppointmentState): string {
  if (state.status === "fulfilled")
    return state.givenOn ? `Đã tiêm ${formatDate(state.givenOn)}` : "Đã tiêm";
  if (state.daysUntil === undefined) return "Chưa có ngày";
  if (state.daysUntil === 0) return "Hôm nay";
  if (state.daysUntil === 1) return "Ngày mai";
  if (state.daysUntil > 0) return `Còn ${String(state.daysUntil)} ngày`;
  return `Quá hạn ${String(-state.daysUntil)} ngày`;
}

export function buildVaccinationView(
  records: readonly DoseRecord[],
  appointments: readonly Appointment[],
  today: string,
  catalog: Catalog = CATALOG,
): VaccinationView {
  const states = appointmentStates(appointments, records, today);
  const open = states
    .filter((s) => s.status === "overdue" || s.status === "today" || s.status === "upcoming")
    .toSorted((a, b) => (a.daysUntil ?? 0) - (b.daysUntil ?? 0));
  const undated = states.filter((s) => s.status === "undated");

  const names = new Map(catalog.diseases.map((d) => [d.code, d.name.vi]));
  const rows = [...dosesByDisease(records, catalog)].map(([code, doses]) => ({
    code,
    name: names.get(code) ?? code,
    doses,
  }));

  const productDiseases = new Map(
    catalog.products.map((p) => [p.code, p.diseases.map((d) => names.get(d) ?? d)]),
  );
  const history = records
    .map((r) => ({
      ...r,
      productName: productName(r.productCode, catalog),
      diseases: productDiseases.get(r.productCode) ?? [],
    }))
    .toSorted(
      (a, b) => b.givenOn.localeCompare(a.givenOn) || a.productName.localeCompare(b.productName),
    );

  return {
    next: nextAppointment(states),
    open,
    undated,
    covered: rows.filter((r) => r.doses.length > 0),
    uncovered: rows.filter((r) => r.doses.length === 0),
    history,
  };
}
