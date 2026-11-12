import { asc, eq } from "drizzle-orm";

import type { Db } from "./client.js";
import { family, familyMember } from "./schema.js";

/**
 * The family of a signed-in user, joining one on first use. Notch serves one
 * household: everyone allowed to sign in shares its oldest family (the one the
 * seed or the first parent created), so both parents see the same children.
 */
export async function familyIdForUser(db: Db, userId: string): Promise<string> {
  const [member] = await db
    .select({ familyId: familyMember.familyId })
    .from(familyMember)
    .where(eq(familyMember.userId, userId));
  if (member) return member.familyId;

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
