"use server";

import { updateChild } from "@notch/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "../../lib/db";
import { type FormState, parseChildProfileForm } from "../../lib/form-values";
import { todayInVietnam } from "../../lib/format";
import { getI18n } from "../../lib/i18n/server";
import { mayEdit, requireViewer } from "../../lib/session";

/** Saves a child's profile; only a child of the signed-in family can be changed. */
export async function updateChildAction(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const { familyId } = viewer;
  const db = getDb();
  const { t, locale } = await getI18n();
  if (!db) return { message: t("error.noDatabase") };
  if (!mayEdit(viewer)) return { message: t("error.readOnly") };
  const childId = form.get("childId");
  if (typeof childId !== "string" || childId === "") return { message: t("error.childGone") };
  const parsed = parseChildProfileForm(form, { today: todayInVietnam(), locale });
  if (!parsed.ok) return parsed.state;
  const saved = await updateChild(db, familyId, childId, parsed.input).catch(() => undefined);
  if (!saved) return { message: t("error.childGone") };
  revalidatePath("/", "layout");
  redirect("/settings");
}
