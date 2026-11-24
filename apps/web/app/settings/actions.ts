"use server";

import {
  AlreadyMemberError,
  BackupFormatError,
  createCalendarToken,
  INVITE_ROLES,
  type InviteRole,
  inviteInputSchema,
  inviteMember,
  removeInvite,
  removeMember,
  restoreBackup,
  revokeCalendarToken,
  setMemberRole,
} from "@notch/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getAppDb } from "../../lib/db";
import { getI18n } from "../../lib/i18n/server";
import { isLocale } from "../../lib/i18n/messages";
import { LOCALE_COOKIE } from "../../lib/i18n/server";
import { isPalette, isTheme, PALETTE_COOKIE, THEME_COOKIE } from "../../lib/preferences";
import { isOwner, requireEditor, requireOwner, requireViewer } from "../../lib/session";

const YEAR = 60 * 60 * 24 * 365;

/** Remembers the theme for this browser. The cookie holds no personal data. */
export async function setThemeAction(theme: string): Promise<void> {
  if (!isTheme(theme)) return;
  const store = await cookies();
  if (theme === "system") store.delete(THEME_COOKIE);
  else store.set(THEME_COOKIE, theme, { path: "/", maxAge: YEAR, sameSite: "lax" });
}

/** Remembers the palette; the lotus, the default, needs no cookie. */
export async function setPaletteAction(palette: string): Promise<void> {
  if (!isPalette(palette)) return;
  const store = await cookies();
  if (palette === "lotus") store.delete(PALETTE_COOKIE);
  else store.set(PALETTE_COOKIE, palette, { path: "/", maxAge: YEAR, sameSite: "lax" });
}

/** Remembers the language for this browser; without it the browser's language is used. */
export async function setLocaleAction(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: YEAR, sameSite: "lax" });
}

function database() {
  const db = getAppDb();
  if (!db) throw new Error("DATABASE_URL is not configured");
  return db;
}

/**
 * Creates (or replaces) the family's calendar link and returns its secret token: the only
 * time it exists in plain text, so the page shows it once.
 */
export async function createCalendarLinkAction(): Promise<string> {
  const { familyId } = await requireEditor();
  const token = await createCalendarToken(database(), familyId);
  revalidatePath("/settings");
  return token;
}

export async function revokeCalendarLinkAction(): Promise<void> {
  const { familyId } = await requireEditor();
  await revokeCalendarToken(database(), familyId);
  revalidatePath("/settings");
}

/** Largest backup accepted; a family's records are a few kilobytes. */
const MAX_BACKUP_BYTES = 1024 * 1024;

export type RestoreState =
  | { readonly ok: true; readonly message: string }
  | { readonly ok: false; readonly message: string };

/** Replaces the family's data with a backup file, after the confirmation on the page. */
export async function restoreBackupAction(form: FormData): Promise<RestoreState> {
  const viewer = await requireViewer();
  const { familyId } = viewer;
  const { t } = await getI18n();
  // A restore replaces everything: owners only.
  if (!isOwner(viewer)) return { ok: false, message: t("error.ownerOnly") };
  const file = form.get("file");
  if (!(file instanceof File)) return { ok: false, message: t("settings.restoreInvalid") };
  if (file.size > MAX_BACKUP_BYTES) return { ok: false, message: t("settings.restoreTooLarge") };
  let data: unknown;
  try {
    data = JSON.parse(await file.text());
  } catch {
    return { ok: false, message: t("settings.restoreInvalid") };
  }
  try {
    const result = await restoreBackup(database(), familyId, data);
    revalidatePath("/", "layout");
    return { ok: true, message: t("settings.restoreDone", { ...result }) };
  } catch (error) {
    if (error instanceof BackupFormatError) {
      return {
        ok: false,
        message:
          error.reason === "product"
            ? t("settings.restoreUnknownProduct", { product: error.detail })
            : t("settings.restoreInvalid"),
      };
    }
    throw error;
  }
}

// ── Family members (owners only) ─────────────────────────────────────────

export interface InviteState {
  readonly ok?: boolean;
  readonly message?: string;
  readonly values?: { readonly email: string; readonly role: string };
}

/** Lets an address sign in and join the family with a role. */
export async function inviteMemberAction(_: InviteState, form: FormData): Promise<InviteState> {
  const viewer = await requireViewer();
  const { t } = await getI18n();
  if (!isOwner(viewer)) return { ok: false, message: t("error.ownerOnly") };
  const email = form.get("email");
  const role = form.get("role");
  const values = {
    email: typeof email === "string" ? email : "",
    role: typeof role === "string" ? role : "",
  };
  const parsed = inviteInputSchema.safeParse(values);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return {
      ok: false,
      message: field === "role" ? t("members.pickRole") : t("members.invalidEmail"),
      values,
    };
  }
  try {
    await inviteMember(database(), viewer.familyId, parsed.data);
  } catch (error) {
    if (error instanceof AlreadyMemberError)
      return { ok: false, message: t("members.alreadyMember"), values };
    throw error;
  }
  revalidatePath("/settings");
  return { ok: true, message: t("members.invited", { email: parsed.data.email }) };
}

export async function removeInviteAction(form: FormData): Promise<void> {
  const { familyId } = await requireOwner();
  const id = form.get("id");
  if (typeof id === "string") await removeInvite(database(), familyId, id).catch(() => false);
  revalidatePath("/settings");
}

export async function removeMemberAction(form: FormData): Promise<void> {
  const { familyId } = await requireOwner();
  // From a DeleteForm, which names the row "id".
  const userId = form.get("id");
  if (typeof userId === "string") await removeMember(database(), familyId, userId);
  revalidatePath("/settings");
}

const isInviteRole = (value: unknown): value is InviteRole =>
  typeof value === "string" && (INVITE_ROLES as readonly string[]).includes(value);

export async function setMemberRoleAction(form: FormData): Promise<void> {
  const { familyId } = await requireOwner();
  const userId = form.get("userId");
  const role = form.get("role");
  if (typeof userId === "string" && isInviteRole(role))
    await setMemberRole(database(), familyId, userId, role);
  revalidatePath("/settings");
}
