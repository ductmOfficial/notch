"use server";

import {
  addMeasurement,
  deleteAppointment,
  deleteMeasurement,
  deleteVaccination,
  DuplicateAppointmentError,
  DuplicateDoseError,
  getChild,
  recordDose,
  saveAppointment,
  updateMeasurement,
} from "@notch/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "../lib/db";
import {
  type FormContext,
  formValues,
  type FormState,
  parseAppointmentForm,
  parseDoseForm,
  parseMeasurementForm,
} from "../lib/form-values";
import { todayInVietnam } from "../lib/format";
import { getI18n } from "../lib/i18n/server";

// No sign-in yet: these actions are meant for a local, single-family setup.
// Authentication (P0-d) must come before the app is deployed anywhere.

async function context(form: FormData): Promise<{ ctx: FormContext } | { error: FormState }> {
  const db = getDb();
  const childId = form.get("childId");
  const { t, locale } = await getI18n();
  if (!db) return { error: { message: t("error.noDatabase") } };
  if (typeof childId !== "string") return { error: { message: t("error.noChildId") } };
  const child = await getChild(db, childId).catch(() => undefined);
  if (!child) return { error: { message: t("error.childNotFound") } };
  return {
    ctx: { childId: child.id, birthDate: child.birthDate, today: todayInVietnam(), locale },
  };
}

function refresh(...paths: string[]) {
  for (const path of ["/", ...paths]) revalidatePath(path);
}

function db() {
  const instance = getDb();
  if (!instance) throw new Error("DATABASE_URL is not configured");
  return instance;
}

export async function saveMeasurementAction(_: FormState, form: FormData): Promise<FormState> {
  const found = await context(form);
  if ("error" in found) return found.error;
  const parsed = parseMeasurementForm(form, found.ctx);
  if (!parsed.ok) return parsed.state;

  const id = form.get("id");
  if (typeof id === "string" && id !== "") {
    const saved = await updateMeasurement(db(), id, parsed.input);
    if (!saved) return { message: (await getI18n()).t("error.measurementGone") };
  } else {
    await addMeasurement(db(), parsed.input);
  }
  refresh("/growth");
  redirect("/growth");
}

export async function deleteMeasurementAction(form: FormData): Promise<void> {
  const found = await context(form);
  const id = form.get("id");
  if ("ctx" in found && typeof id === "string")
    await deleteMeasurement(db(), id, found.ctx.childId);
  refresh("/growth");
  redirect("/growth");
}

export async function recordDoseAction(_: FormState, form: FormData): Promise<FormState> {
  const found = await context(form);
  if ("error" in found) return found.error;
  const parsed = parseDoseForm(form, found.ctx);
  if (!parsed.ok) return parsed.state;
  try {
    await recordDose(db(), parsed.input);
  } catch (error) {
    if (error instanceof DuplicateDoseError) {
      return {
        errors: { doseNo: (await getI18n()).t("error.doseExists") },
        values: formValues(form),
      };
    }
    throw error;
  }
  refresh("/vaccines");
  redirect("/vaccines");
}

export async function deleteDoseAction(form: FormData): Promise<void> {
  const found = await context(form);
  const id = form.get("id");
  if ("ctx" in found && typeof id === "string")
    await deleteVaccination(db(), id, found.ctx.childId);
  refresh("/vaccines");
  redirect("/vaccines");
}

export async function saveAppointmentAction(_: FormState, form: FormData): Promise<FormState> {
  const found = await context(form);
  if ("error" in found) return found.error;
  const parsed = parseAppointmentForm(form, found.ctx);
  if (!parsed.ok) return parsed.state;
  const id = form.get("id");
  try {
    const saved = await saveAppointment(
      db(),
      parsed.input,
      typeof id === "string" && id !== "" ? id : undefined,
    );
    if (!saved) return { message: (await getI18n()).t("error.appointmentGone") };
  } catch (error) {
    if (error instanceof DuplicateAppointmentError) {
      return {
        errors: { doseNo: (await getI18n()).t("error.appointmentExists") },
        values: formValues(form),
      };
    }
    throw error;
  }
  refresh("/vaccines");
  redirect("/vaccines");
}

export async function deleteAppointmentAction(form: FormData): Promise<void> {
  const found = await context(form);
  const id = form.get("id");
  if ("ctx" in found && typeof id === "string")
    await deleteAppointment(db(), id, found.ctx.childId);
  refresh("/vaccines");
  redirect("/vaccines");
}
