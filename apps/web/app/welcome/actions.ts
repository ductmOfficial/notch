"use server";

import { addChild } from "@notch/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "../../lib/db";
import { type FormState, parseChildForm } from "../../lib/form-values";
import { todayInVietnam } from "../../lib/format";
import { getI18n } from "../../lib/i18n/server";
import { requireViewer } from "../../lib/session";

/** Creates the family's first child; the family comes from the session. */
export async function createChildAction(_: FormState, form: FormData): Promise<FormState> {
  const { familyId } = await requireViewer();
  const db = getDb();
  const { t, locale } = await getI18n();
  if (!db) return { message: t("error.noDatabase") };
  const parsed = parseChildForm(form, { familyId, today: todayInVietnam(), locale });
  if (!parsed.ok) return parsed.state;
  await addChild(db, parsed.input);
  revalidatePath("/", "layout");
  redirect("/");
}
