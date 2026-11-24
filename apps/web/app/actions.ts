"use server";

import {
  addHealthEntry,
  addMeasurement,
  addMilestone,
  addTemperature,
  deleteHealthEntry,
  deleteTemperature,
  listHealthEntries,
  UnknownHealthEntryError,
  updateHealthEntry,
  updateTemperature,
  deleteMilestone,
  updateMilestone,
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
  parseHealthEntryForm,
  parseMeasurementForm,
  parseMilestoneForm,
  parseTemperatureForm,
} from "../lib/form-values";
import { todayInVietnam } from "../lib/format";
import { getI18n } from "../lib/i18n/server";
import { mayEdit, requireViewer } from "../lib/session";

// Every action checks the session, that the role may write, and that the child belongs to the
// signed-in family.

async function context(form: FormData): Promise<{ ctx: FormContext } | { error: FormState }> {
  const viewer = await requireViewer();
  const db = getDb();
  const childId = form.get("childId");
  const { t, locale } = await getI18n();
  if (!db) return { error: { message: t("error.noDatabase") } };
  if (!mayEdit(viewer)) return { error: { message: t("error.readOnly") } };
  if (typeof childId !== "string") return { error: { message: t("error.noChildId") } };
  const child = await getChild(db, childId).catch(() => undefined);
  // Another family's child reads as missing, so its id reveals nothing.
  if (child?.familyId !== viewer.familyId) return { error: { message: t("error.childNotFound") } };
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

/** Adds a milestone, or updates `id` when the form carries one. */
export async function saveMilestoneAction(_: FormState, form: FormData): Promise<FormState> {
  const found = await context(form);
  if ("error" in found) return found.error;
  const parsed = parseMilestoneForm(form, found.ctx);
  if (!parsed.ok) return parsed.state;
  const id = form.get("id");
  if (typeof id === "string" && id !== "") {
    const saved = await updateMilestone(db(), id, parsed.input).catch(() => undefined);
    if (!saved) return { message: (await getI18n()).t("error.milestoneGone") };
  } else {
    await addMilestone(db(), parsed.input);
  }
  refresh("/child");
  redirect(`/child?child=${found.ctx.childId}`);
}

export async function deleteMilestoneAction(form: FormData): Promise<void> {
  const found = await context(form);
  const id = form.get("id");
  if ("ctx" in found && typeof id === "string")
    await deleteMilestone(db(), id, found.ctx.childId).catch(() => false);
  refresh("/child");
  redirect("/child");
}

const healthPage = (childId: string) => `/health?child=${childId}`;

/** Adds an illness, a medicine or a doctor's visit, or updates `id` when the form carries one. */
export async function saveHealthEntryAction(_: FormState, form: FormData): Promise<FormState> {
  const found = await context(form);
  if ("error" in found) return found.error;
  const parsed = parseHealthEntryForm(form, found.ctx);
  if (!parsed.ok) return parsed.state;
  const id = form.get("id");
  if (typeof id === "string" && id !== "") {
    const saved = await updateHealthEntry(db(), id, parsed.input).catch(() => undefined);
    if (!saved) return { message: (await getI18n()).t("error.healthEntryGone") };
  } else {
    await addHealthEntry(db(), parsed.input);
  }
  refresh("/health", "/child");
  redirect(healthPage(found.ctx.childId));
}

export async function deleteHealthEntryAction(form: FormData): Promise<void> {
  const found = await context(form);
  const id = form.get("id");
  if ("ctx" in found && typeof id === "string")
    await deleteHealthEntry(db(), id, found.ctx.childId).catch(() => false);
  refresh("/health", "/child");
  redirect("/health");
}

/** Adds a temperature reading, or updates `id` when the form carries one. */
export async function saveTemperatureAction(_: FormState, form: FormData): Promise<FormState> {
  const found = await context(form);
  if ("error" in found) return found.error;
  const entries = await listHealthEntries(db(), found.ctx.childId);
  const parsed = parseTemperatureForm(
    form,
    found.ctx,
    entries.map((e) => e.id),
  );
  if (!parsed.ok) return parsed.state;
  const id = form.get("id");
  try {
    if (typeof id === "string" && id !== "") {
      const saved = await updateTemperature(db(), id, parsed.input);
      if (!saved) return { message: (await getI18n()).t("error.temperatureGone") };
    } else {
      await addTemperature(db(), parsed.input);
    }
  } catch (error) {
    // The entry was deleted between loading the form and saving it.
    if (error instanceof UnknownHealthEntryError) {
      return {
        errors: { healthEntryId: (await getI18n()).t("error.unknownHealthEntry") },
        values: formValues(form),
      };
    }
    throw error;
  }
  refresh("/health");
  redirect(healthPage(found.ctx.childId));
}

export async function deleteTemperatureAction(form: FormData): Promise<void> {
  const found = await context(form);
  const id = form.get("id");
  if ("ctx" in found && typeof id === "string")
    await deleteTemperature(db(), id, found.ctx.childId).catch(() => false);
  refresh("/health");
  redirect("/health");
}
