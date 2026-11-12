import type { AppointmentInput, DoseInput, MeasurementInput } from "@notch/db";
import { CATALOG, type Catalog } from "@notch/vaccines";

import { formatNumber } from "./format";
import { type Locale, type MessageKey, translator } from "./i18n/messages";

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
  /** Language of the error messages; Vietnamese by default. */
  readonly locale?: Locale;
}

const tr = (ctx: FormContext) => translator(ctx.locale ?? "vi");

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
  label: MessageKey,
  required: boolean,
): string | undefined {
  const t = tr(ctx);
  const field = t(label);
  if (raw === "") return required ? t("error.required", { field: field.toLowerCase() }) : undefined;
  if (!ISO_DATE.test(raw) || Number.isNaN(Date.parse(raw)))
    return t("error.invalidDate", { field });
  if (raw < ctx.birthDate) return t("error.beforeBirth", { field });
  return undefined;
}

function checkPastDate(raw: string, ctx: FormContext, label: MessageKey): string | undefined {
  return (
    checkDate(raw, ctx, label, true) ??
    (raw > ctx.today ? tr(ctx)("error.future", { field: tr(ctx)(label) }) : undefined)
  );
}

function range(
  raw: string,
  min: number,
  max: number,
  unit: string,
  label: MessageKey,
  ctx: FormContext,
): [number | null, string | undefined] {
  const t = tr(ctx);
  const n = parseDecimal(raw);
  if (n === null) return [null, undefined];
  const example = formatNumber(8.6, 1, ctx.locale ?? "vi");
  if (Number.isNaN(n)) return [null, t("error.notNumber", { field: t(label), example })];
  if (n < min || n > max) return [null, t("error.outOfRange", { field: t(label), min, max, unit })];
  return [n, undefined];
}

function wholeNumber(
  raw: string,
  label: MessageKey,
  ctx: FormContext,
): [number, string | undefined] {
  const n = Number(raw);
  if (!/^\d+$/.test(raw) || n < 1 || n > 20)
    return [0, tr(ctx)("error.wholeNumber", { field: tr(ctx)(label) })];
  return [n, undefined];
}

function checkProduct(code: string, catalog: Catalog, ctx: FormContext): string | undefined {
  return catalog.products.some((p) => p.code === code) ? undefined : tr(ctx)("error.pickVaccine");
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
  const [weight, weightError] = range(text(form, "weightKg"), 0.3, 60, "kg", "field.weight", ctx);
  const [length, lengthError] = range(text(form, "lengthCm"), 30, 150, "cm", "field.length", ctx);
  const [head, headError] = range(text(form, "headCm"), 20, 70, "cm", "field.head", ctx);
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
      measuredOn: checkPastDate(measuredOn, ctx, "field.measuredOn"),
      weightKg: weightError ?? (empty ? tr(ctx)("error.atLeastOne") : undefined),
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
  const [doseNo, doseError] = wholeNumber(text(form, "doseNo"), "field.doseNo", ctx);
  const nextDueOn = text(form, "nextDueOn");
  const nextNote = text(form, "nextNote");
  const wantsNext = nextDueOn !== "" || nextNote !== "";
  const [nextDoseNo, nextDoseError] = wantsNext
    ? wholeNumber(text(form, "nextDoseNo"), "field.nextDoseNo", ctx)
    : [0, undefined];
  const nextDateError =
    checkDate(nextDueOn, ctx, "field.dueOn", false) ??
    (nextDueOn !== "" && givenOn !== "" && nextDueOn <= givenOn
      ? tr(ctx)("error.dueAfterGiven")
      : undefined);
  const optional = (name: string) => text(form, name) || null;

  return result(
    form,
    {
      productCode: checkProduct(productCode, catalog, ctx),
      doseNo: doseError,
      givenOn: checkPastDate(givenOn, ctx, "field.givenOn"),
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
  const [doseNo, doseError] = wholeNumber(text(form, "doseNo"), "field.doseNo", ctx);

  return result(
    form,
    {
      productCode: checkProduct(productCode, catalog, ctx),
      doseNo: doseError,
      dueOn:
        checkDate(dueOn, ctx, "field.dueOn", false) ??
        (dueOn === "" && note === "" ? tr(ctx)("error.dueOrNote") : undefined),
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
