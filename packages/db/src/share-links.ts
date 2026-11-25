import { randomBytes } from "node:crypto";

import { and, eq, getTableColumns, gt, isNull, or } from "drizzle-orm";

import type { Db } from "./client.js";
import type { Child } from "./queries.js";
import { child, shareLink } from "./schema.js";

export type ShareLink = typeof shareLink.$inferSelect;

/** How long a new link works: a week, a month, or until it is revoked. */
export const SHARE_LINK_DURATIONS = ["week", "month", "never"] as const;
export type ShareLinkDuration = (typeof SHARE_LINK_DURATIONS)[number];

const DAYS: Record<ShareLinkDuration, number | null> = { week: 7, month: 30, never: null };
const DAY_MS = 24 * 60 * 60 * 1000;

/** 32 random bytes, URL-safe: long enough that guessing a link is not a concern. */
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

/** Whether a link still opens the page at `now`. */
export const isShareLinkActive = (link: Pick<ShareLink, "expiresAt">, now: Date): boolean =>
  link.expiresAt === null || link.expiresAt > now;

/** Whether `childId` belongs to `familyId`. */
async function familyChild(db: Db, familyId: string, childId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: child.id })
    .from(child)
    .where(and(eq(child.id, childId), eq(child.familyId, familyId)));
  return row !== undefined;
}

/**
 * Makes a new public link to a child's page, replacing the child's old link. Returns
 * undefined when the child is not in the family.
 */
export async function createShareLink(
  db: Db,
  familyId: string,
  childId: string,
  duration: ShareLinkDuration,
  now: Date = new Date(),
): Promise<ShareLink | undefined> {
  if (!(await familyChild(db, familyId, childId))) return undefined;
  const days = DAYS[duration];
  const values = {
    token: randomBytes(32).toString("base64url"),
    expiresAt: days === null ? null : new Date(now.getTime() + days * DAY_MS),
    createdAt: now,
    lastViewedAt: null,
  };
  const [row] = await db
    .insert(shareLink)
    .values({ childId, ...values })
    .onConflictDoUpdate({ target: shareLink.childId, set: values })
    .returning();
  return row;
}

/** The family's links, expired ones included, so Settings can offer to renew them. */
export async function listShareLinks(db: Db, familyId: string): Promise<ShareLink[]> {
  return db
    .select(getTableColumns(shareLink))
    .from(shareLink)
    .innerJoin(child, eq(child.id, shareLink.childId))
    .where(eq(child.familyId, familyId));
}

/** Revokes a child's link; it stops working at once. False when there was none. */
export async function revokeShareLink(db: Db, familyId: string, childId: string): Promise<boolean> {
  if (!(await familyChild(db, familyId, childId))) return false;
  const rows = await db
    .delete(shareLink)
    .where(eq(shareLink.childId, childId))
    .returning({ id: shareLink.id });
  return rows.length > 0;
}

/**
 * The child a public link opens, recording the visit; undefined for an unknown, revoked or
 * expired link.
 */
export async function childForShareToken(
  db: Db,
  token: string,
  now: Date = new Date(),
): Promise<{ child: Child; expiresAt: Date | null } | undefined> {
  if (!TOKEN.test(token)) return undefined;
  const [link] = await db
    .update(shareLink)
    .set({ lastViewedAt: now })
    .where(
      and(
        eq(shareLink.token, token),
        or(isNull(shareLink.expiresAt), gt(shareLink.expiresAt, now)),
      ),
    )
    .returning({ childId: shareLink.childId, expiresAt: shareLink.expiresAt });
  if (!link) return undefined;
  const [row] = await db.select().from(child).where(eq(child.id, link.childId));
  /* v8 ignore next -- @preserve: the link's child is there, or the cascade removed the link */
  if (!row) return undefined;
  return { child: row, expiresAt: link.expiresAt };
}
