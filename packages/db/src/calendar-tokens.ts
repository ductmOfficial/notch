import { createHash, randomBytes } from "node:crypto";

import { eq } from "drizzle-orm";

import type { Db } from "./client.js";
import { calendarToken } from "./schema.js";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** 32 random bytes, URL-safe: long enough that guessing a link is not a concern. */
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

export interface CalendarLinkInfo {
  readonly createdAt: Date;
  readonly lastUsedAt: Date | null;
}

/**
 * Creates the family's calendar link and returns its token, the only time it is
 * available in plain text. An existing link stops working.
 */
export async function createCalendarToken(db: Db, familyId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db
    .insert(calendarToken)
    .values({ familyId, tokenHash: hash(token) })
    .onConflictDoUpdate({
      target: calendarToken.familyId,
      set: { tokenHash: hash(token), createdAt: new Date(), lastUsedAt: null },
    });
  return token;
}

/** The family a calendar token belongs to, recording the use; undefined when unknown. */
export async function familyIdForCalendarToken(db: Db, token: string): Promise<string | undefined> {
  if (!TOKEN.test(token)) return undefined;
  const [row] = await db
    .update(calendarToken)
    .set({ lastUsedAt: new Date() })
    .where(eq(calendarToken.tokenHash, hash(token)))
    .returning({ familyId: calendarToken.familyId });
  return row?.familyId;
}

/** When the family's link was made and last read, or undefined when there is none. */
export async function calendarLinkInfo(
  db: Db,
  familyId: string,
): Promise<CalendarLinkInfo | undefined> {
  const [row] = await db
    .select({ createdAt: calendarToken.createdAt, lastUsedAt: calendarToken.lastUsedAt })
    .from(calendarToken)
    .where(eq(calendarToken.familyId, familyId));
  return row;
}

/** Revokes the family's link; calendars subscribed to it stop updating. */
export async function revokeCalendarToken(db: Db, familyId: string): Promise<void> {
  await db.delete(calendarToken).where(eq(calendarToken.familyId, familyId));
}
