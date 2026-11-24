import "server-only";

import { type Child, familyForUser, type MemberRole, UnknownUserError } from "@notch/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { allowedEmails } from "./allowlist";
import { getAuth } from "./auth";
import { getAppDb } from "./db";
import { demoFamily, isDemo } from "./demo";

export interface Viewer {
  readonly userId: string;
  readonly email: string;
  readonly familyId: string;
  /** Owners manage the family, editors add and change records, viewers only read. */
  readonly role: MemberRole;
  /** The family's children, oldest first, read with the family in the same query. */
  readonly children: Child[];
}

/**
 * The signed-in user and their family, once per request. Someone who may no longer use
 * Notch (an owner removed from NOTCH_ALLOWED_EMAILS, a relative removed from the family, a
 * cookie naming a user this database lacks) counts as signed out even while their session
 * cookie is still valid.
 */
export const getViewer = cache(async (): Promise<Viewer | undefined> => {
  // The demo needs no account: a viewer of the fictional family in the in-memory database.
  if (await isDemo()) {
    return { userId: "demo", email: "demo", role: "viewer", ...(await demoFamily()) };
  }
  const auth = getAuth();
  const db = getAppDb();
  if (!auth || !db) return undefined;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return undefined;
  let family;
  try {
    family = await familyForUser(db, session.user, allowedEmails());
  } catch (error) {
    // A cookie for a user this database lacks: sign in again rather than fail the page.
    if (error instanceof UnknownUserError) return undefined;
    throw error;
  }
  if (!family) return undefined;
  return { userId: session.user.id, email: session.user.email, ...family };
});

/** The signed-in user, or a redirect to the sign-in page. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  return viewer;
}

/** Editors and owners add and change records; viewers only read. */
export const mayEdit = (viewer: Pick<Viewer, "role">): boolean => viewer.role !== "viewer";

/** Only owners restore backups and manage who belongs to the family. */
export const isOwner = (viewer: Pick<Viewer, "role">): boolean => viewer.role === "owner";

/** A write from someone whose role does not allow it; the page hides these controls. */
export class ForbiddenError extends Error {
  constructor() {
    super("Not allowed for this role");
    this.name = "ForbiddenError";
  }
}

/** The signed-in editor or owner; throws `ForbiddenError` for a viewer. */
export async function requireEditor(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!mayEdit(viewer)) throw new ForbiddenError();
  return viewer;
}

/** The signed-in owner; throws `ForbiddenError` otherwise. */
export async function requireOwner(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!isOwner(viewer)) throw new ForbiddenError();
  return viewer;
}
