import "server-only";

import { familyIdForUser } from "@notch/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { allowedEmails, isAllowed } from "./allowlist";
import { getAuth } from "./auth";
import { getDb } from "./db";

export interface Viewer {
  readonly userId: string;
  readonly email: string;
  readonly familyId: string;
}

/**
 * The signed-in parent and their family, once per request. Someone removed from the
 * allowlist counts as signed out even while their session cookie is still valid.
 */
export const getViewer = cache(async (): Promise<Viewer | undefined> => {
  const auth = getAuth();
  const db = getDb();
  if (!auth || !db) return undefined;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAllowed(session.user.email, allowedEmails())) return undefined;
  return {
    userId: session.user.id,
    email: session.user.email,
    familyId: await familyIdForUser(db, session.user.id),
  };
});

/** The signed-in parent, or a redirect to the sign-in page. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  return viewer;
}
