import { asc, eq, getTableColumns } from "drizzle-orm";

import type { Db } from "./client.js";
import { type Child, listChildren } from "./queries.js";
import { child, family, familyMember, user } from "./schema.js";

/**
 * A session names a user this database does not know: a signed session cookie made
 * by another database (two local servers share cookies on localhost), or a user
 * removed since. The caller treats it as signed out.
 */
export class UnknownUserError extends Error {
  constructor(readonly userId: string) {
    super("Unknown user");
    this.name = "UnknownUserError";
  }
}

/**
 * The family of a signed-in user, joining one on first use. Notch serves one
 * household: everyone allowed to sign in shares its oldest family (the one the
 * seed or the first parent created), so both parents see the same children.
 * Throws `UnknownUserError` for a user the database does not have.
 */
export async function familyIdForUser(db: Db, userId: string): Promise<string> {
  const [member] = await db
    .select({ familyId: familyMember.familyId })
    .from(familyMember)
    .where(eq(familyMember.userId, userId));
  if (member) return member.familyId;

  const [known] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId));
  if (!known) throw new UnknownUserError(userId);

  let [home] = await db
    .select({ id: family.id })
    .from(family)
    .orderBy(asc(family.createdAt), asc(family.id))
    .limit(1);
  if (!home) [home] = await db.insert(family).values({ name: "Gia đình" }).returning();
  if (!home) throw new Error("Could not create a family");

  // Two first requests at once: the unique user id keeps one row, and both read it back.
  await db.insert(familyMember).values({ familyId: home.id, userId }).onConflictDoNothing();
  const [joined] = await db
    .select({ familyId: familyMember.familyId })
    .from(familyMember)
    .where(eq(familyMember.userId, userId));
  if (!joined) throw new Error("Could not join the family");
  return joined.familyId;
}

export interface FamilyOfUser {
  readonly familyId: string;
  /** The family's children, oldest first. */
  readonly children: Child[];
}

/**
 * The user's family and its children in one query, since every page needs both. A user
 * who has not joined a family yet joins one first, as in `familyIdForUser`.
 */
export async function familyForUser(db: Db, userId: string): Promise<FamilyOfUser> {
  const rows = await db
    .select({ familyId: familyMember.familyId, child: getTableColumns(child) })
    .from(familyMember)
    .leftJoin(child, eq(child.familyId, familyMember.familyId))
    .where(eq(familyMember.userId, userId))
    .orderBy(asc(child.birthDate), asc(child.createdAt));
  const [first] = rows;
  if (first) {
    return {
      familyId: first.familyId,
      children: rows.flatMap((r) => (r.child ? [r.child] : [])),
    };
  }
  const familyId = await familyIdForUser(db, userId);
  return { familyId, children: await listChildren(db, familyId) };
}
