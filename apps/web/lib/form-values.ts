import type { AppointmentInput, DoseInput, MeasurementInput } from "@notch/db";
import { CATALOG, type Catalog } from "@notch/vaccines";

/** What a form shows after a failed submit: messages per field and the values typed. */
export interface FormState {
  readonly errors?: Readonly<Record<string, string>>;
  readonly values?: Readonly<Record<string, string>>;
  readonly message?: string;
}

export type Parsed<T> = { ok: true; input: T } | { ok: false; state: FormState };

export interface FormContext {
  readonly childId: string;
  readonly birthDate: string;
  readonly today: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function text(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Every text field, to refill the form after an error. */
export function formValues(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of form.entries()) if (typeof value === "string") out[key] = value;
  return out;
}

/** Accepts "8,6", "8.6" and " 8 ". Returns null when empty, NaN when not a number. */
export function parseDecimal(raw: string): number | null {
  const value = raw.trim().replace(",", ".");
  if (value === "") return null;
  return /^\d+(\.\d+)?$/.test(value) ? Number(value) : Number.NaN;
}

function checkDate(
  raw: string,
  ctx: FormContext,
  label: string,
  required: boolean,
): string | undefined {
  if (raw === "") return required ? `Nhập ${label.toLowerCase()}.` : undefined;
  if (!ISO_DATE.test(raw) || Number.isNaN(Date.parse(raw))) return `${label} không hợp lệ.`;
  if (raw < ctx.birthDate) return `${label} không thể trước ngày sinh.`;
  return undefined;
}

function checkPastDate(raw: string, ctx: FormContext, label: string): string | undefined {
  return (
    checkDate(raw, ctx, label, true) ??
    (raw > ctx.today ? `${label} không thể ở tương lai.` : undefined)
  );
}

function range(
  raw: string,
  min: number,
  max: number,
  unit: string,
  label: string,
): [number | null, string | undefined] {
  const n = parseDecimal(raw);
  if (n === null) return [null, undefined];
  if (Number.isNaN(n)) return [null, `${label} phải là số, ví dụ 8,6.`];
  if (n < min || n > max)
    return [null, `${label} phải từ ${String(min)} đến ${String(max)} ${unit}.`];
  return [n, undefined];
}

function wholeNumber(raw: string, label: string): [number, string | undefined] {
  const n = Number(raw);
  if (!/^\d+$/.test(raw) || n < 1 || n > 20) return [0, `${label} phải là số nguyên từ 1 đến 20.`];
  return [n, undefined];
}

function checkProduct(code: string, catalog: Catalog): string | undefined {
  return catalog.products.some((p) => p.code === code)
    ? undefined
    : "Chọn vaccine trong danh sách.";
}

function result<T>(
  form: FormData,
  errors: Record<string, string | undefined>,
  build: () => T,
): Parsed<T> {
  const found = Object.fromEntries(
    Object.entries(errors).filter((e): e is [string, string] => e[1] !== undefined),
  );
  if (Object.keys(found).length > 0)
    return { ok: false, state: { errors: found, values: formValues(form) } };
  return { ok: true, input: build() };
}

export function parseMeasurementForm(form: FormData, ctx: FormContext): Parsed<MeasurementInput> {
  const measuredOn = text(form, "measuredOn");
  const [weight, weightError] = range(text(form, "weightKg"), 0.3, 60, "kg", "Cân nặng");
  const [length, lengthError] = range(text(form, "lengthCm"), 30, 150, "cm", "Chiều dài");
  const [head, headError] = range(text(form, "headCm"), 20, 70, "cm", "Vòng đầu");
  const empty =
    weight === null &&
    length === null &&
    head === null &&
    !weightError &&
    !lengthError &&
    !headError;
  const note = text(form, "note");

  return result(
    form,
    {
      measuredOn: checkPastDate(measuredOn, ctx, "Ngày đo"),
      weightKg: weightError ?? (empty ? "Nhập ít nhất một chỉ số." : undefined),
      lengthCm: lengthError,
      headCm: headError,
    },
    () => ({
      childId: ctx.childId,
      measuredOn,
      weightG: weight === null ? null : Math.round(weight * 1000),
      lengthMm: length === null ? null : Math.round(length * 10),
      headMm: head === null ? null : Math.round(head * 10),
      weightEstimated: weight !== null && form.get("weightEstimated") === "on",
      lengthEstimated: length !== null && form.get("lengthEstimated") === "on",
      headEstimated: head !== null && form.get("headEstimated") === "on",
      note: note === "" ? null : note,
    }),
  );
}

export function parseDoseForm(
  form: FormData,
  ctx: FormContext,
  catalog: Catalog = CATALOG,
): Parsed<DoseInput> {
  const productCode = text(form, "productCode");
  const givenOn = text(form, "givenOn");
  const [doseNo, doseError] = wholeNumber(text(form, "doseNo"), "Mũi số");
  const nextDueOn = text(form, "nextDueOn");
  const nextNote = text(form, "nextNote");
  const wantsNext = nextDueOn !== "" || nextNote !== "";
  const [nextDoseNo, nextDoseError] = wantsNext
    ? wholeNumber(text(form, "nextDoseNo"), "Mũi hẹn")
    : [0, undefined];
  const nextDateError =
    checkDate(nextDueOn, ctx, "Ngày hẹn", false) ??
    (nextDueOn !== "" && givenOn !== "" && nextDueOn <= givenOn
      ? "Ngày hẹn phải sau ngày tiêm."
      : undefined);
  const optional = (name: string) => text(form, name) || null;

  return result(
    form,
    {
      productCode: checkProduct(productCode, catalog),
      doseNo: doseError,
      givenOn: checkPastDate(givenOn, ctx, "Ngày tiêm"),
      nextDoseNo: nextDoseError,
      nextDueOn: nextDateError,
    },
    () => ({
      childId: ctx.childId,
      productCode,
      doseNo,
      givenOn,
      place: optional("place"),
      lot: optional("lot"),
      note: optional("note"),
      nextAppointment: wantsNext
        ? {
            doseNo: nextDoseNo,
            dueOn: nextDueOn === "" ? null : nextDueOn,
            note: nextNote === "" ? null : nextNote,
          }
        : null,
    }),
  );
}

export function parseAppointmentForm(
  form: FormData,
  ctx: FormContext,
  catalog: Catalog = CATALOG,
): Parsed<AppointmentInput> {
  const productCode = text(form, "productCode");
  const dueOn = text(form, "dueOn");
  const note = text(form, "note");
  const [doseNo, doseError] = wholeNumber(text(form, "doseNo"), "Mũi số");

  return result(
    form,
    {
      productCode: checkProduct(productCode, catalog),
      doseNo: doseError,
      dueOn:
        checkDate(dueOn, ctx, "Ngày hẹn", false) ??
        (dueOn === "" && note === "" ? "Nhập ngày hẹn, hoặc ghi chú như “sau 1 tuổi”." : undefined),
    },
    () => ({
      childId: ctx.childId,
      productCode,
      doseNo,
      dueOn: dueOn === "" ? null : dueOn,
      note: note === "" ? null : note,
    }),
  );
}

/** Value for an input: what was typed after an error, else the stored default. */
export function fieldValue(state: FormState, name: string, fallback = ""): string {
  return state.values?.[name] ?? fallback;
}
