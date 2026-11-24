import { and, asc, eq, getTableColumns, ne, sql } from "drizzle-orm";
import { z } from "zod";

import type { Db } from "./client.js";
import { type Child, listChildren } from "./queries.js";
import { child, family, familyInvite, familyMember, user } from "./schema.js";

/** Owners manage the family, editors add and change records, viewers only read. */
export type MemberRole = (typeof familyMember.$inferSelect)["role"];
/** The roles an owner can give a relative; owners come from NOTCH_ALLOWED_EMAILS. */
export const INVITE_ROLES = ["editor", "viewer"] as const;
export type InviteRole = (typeof INVITE_ROLES)[number];

export type FamilyInvite = typeof familyInvite.$inferSelect;

export interface FamilyMemberRow {
  readonly userId: string;
  readonly email: string;
  readonly role: MemberRole;
  readonly createdAt: Date;
}

/** Addresses match without regard to case or surrounding spaces. */
export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

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

/** The address already belongs to a member of the family. */
export class AlreadyMemberError extends Error {
  constructor() {
    super("This address is already a member");
    this.name = "AlreadyMemberError";
  }
}

async function requireUser(db: Db, userId: string): Promise<void> {
  const [known] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId));
  if (!known) throw new UnknownUserError(userId);
}

/**
 * The family of an owner, joining one on first use. Notch serves one household: every
 * owner shares its oldest family (the one the seed or the first parent created), so both
 * parents see the same children. Throws `UnknownUserError` for a user the database does
 * not have.
 */
export async function familyIdForUser(db: Db, userId: string): Promise<string> {
  const [member] = await db
    .select({ familyId: familyMember.familyId })
    .from(familyMember)
    .where(eq(familyMember.userId, userId));
  if (member) return member.familyId;

  await requireUser(db, userId);

  let [home] = await db
    .select({ id: family.id })
    .from(family)
    .orderBy(asc(family.createdAt), asc(family.id))
    .limit(1);
  if (!home) [home] = await db.insert(family).values({ name: "Gia đình" }).returning();
  if (!home) throw new Error("Could not create a family");

  // Two first requests at once: the unique user id keeps one row, and both read it back.
  await db
    .insert(familyMember)
    .values({ familyId: home.id, userId, role: "owner" })
    .onConflictDoNothing();
  const [joined] = await db
    .select({ familyId: familyMember.familyId })
    .from(familyMember)
    .where(eq(familyMember.userId, userId));
  if (!joined) throw new Error("Could not join the family");
  return joined.familyId;
}

export interface FamilyOfUser {
  readonly familyId: string;
  readonly role: MemberRole;
  /** The family's children, oldest first. */
  readonly children: Child[];
}

async function membership(db: Db, userId: string): Promise<FamilyOfUser | undefined> {
  const rows = await db
    .select({
      familyId: familyMember.familyId,
      role: familyMember.role,
      child: getTableColumns(child),
    })
    .from(familyMember)
    .leftJoin(child, eq(child.familyId, familyMember.familyId))
    .where(eq(familyMember.userId, userId))
    .orderBy(asc(child.birthDate), asc(child.createdAt));
  const [first] = rows;
  if (!first) return undefined;
  return {
    familyId: first.familyId,
    role: first.role,
    children: rows.flatMap((r) => (r.child ? [r.child] : [])),
  };
}

/**
 * The signed-in user's family, role and children, in one query on most requests; undefined
 * when the user may not use Notch (they then count as signed out):
 *
 * - a member keeps their role, except an owner whose address left `owners`;
 * - an address on `owners` (NOTCH_ALLOWED_EMAILS) joins the household as an owner;
 * - an invited address joins the inviting family with the invite's role, and the invite
 *   becomes the membership.
 */
export async function familyForUser(
  db: Db,
  signedIn: { readonly id: string; readonly email: string },
  owners: ReadonlySet<string>,
): Promise<FamilyOfUser | undefined> {
  const email = normalizeEmail(signedIn.email);
  const member = await membership(db, signedIn.id);
  if (member) return member.role === "owner" && !owners.has(email) ? undefined : member;

  if (owners.has(email)) {
    const familyId = await familyIdForUser(db, signedIn.id);
    return { familyId, role: "owner", children: await listChildren(db, familyId) };
  }

  const [invite] = await db.select().from(familyInvite).where(eq(familyInvite.email, email));
  if (!invite) return undefined;
  await requireUser(db, signedIn.id);
  await db.transaction(async (tx) => {
    await tx
      .insert(familyMember)
      .values({ familyId: invite.familyId, userId: signedIn.id, role: invite.role })
      .onConflictDoNothing();
    await tx.delete(familyInvite).where(eq(familyInvite.id, invite.id));
  });
  return membership(db, signedIn.id);
}

/**
 * Whether an address may get a sign-in link or an account: an owner, an invited relative, or
 * a relative who already joined. A removed relative may not.
 */
export async function maySignIn(
  db: Db,
  rawEmail: string,
  owners: ReadonlySet<string>,
): Promise<boolean> {
  const email = normalizeEmail(rawEmail);
  if (owners.has(email)) return true;
  const [invited] = await db
    .select({ id: familyInvite.id })
    .from(familyInvite)
    .where(eq(familyInvite.email, email));
  if (invited) return true;
  const [member] = await db
    .select({ userId: familyMember.userId })
    .from(familyMember)
    .innerJoin(user, eq(user.id, familyMember.userId))
    .where(and(sql`lower(${user.email}) = ${email}`, ne(familyMember.role, "owner")));
  return member !== undefined;
}

// ── Managing members (owners only; the app checks the role) ────────────────

/** The family's members, the first to join first. */
export async function listMembers(db: Db, familyId: string): Promise<FamilyMemberRow[]> {
  return db
    .select({
      userId: familyMember.userId,
      email: user.email,
      role: familyMember.role,
      createdAt: familyMember.createdAt,
    })
    .from(familyMember)
    .innerJoin(user, eq(user.id, familyMember.userId))
    .where(eq(familyMember.familyId, familyId))
    .orderBy(asc(familyMember.createdAt), asc(user.email));
}

/** Invites not used yet, the oldest first. */
export async function listInvites(db: Db, familyId: string): Promise<FamilyInvite[]> {
  return db
    .select()
    .from(familyInvite)
    .where(eq(familyInvite.familyId, familyId))
    .orderBy(asc(familyInvite.createdAt), asc(familyInvite.email));
}

export const inviteInputSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  role: z.enum(INVITE_ROLES),
});

export type InviteInput = z.input<typeof inviteInputSchema>;

/**
 * Lets an address sign in and join the family with `role`. Inviting the same address again
 * changes the role. Throws `AlreadyMemberError` when it already belongs to a member.
 */
export async function inviteMember(
  db: Db,
  familyId: string,
  input: InviteInput,
): Promise<FamilyInvite> {
  const { email, role } = inviteInputSchema.parse(input);
  const [member] = await db
    .select({ userId: familyMember.userId })
    .from(familyMember)
    .innerJoin(user, eq(user.id, familyMember.userId))
    .where(sql`lower(${user.email}) = ${email}`);
  if (member) throw new AlreadyMemberError();
  const [row] = await db
    .insert(familyInvite)
    .values({ familyId, email, role })
    .onConflictDoUpdate({ target: familyInvite.email, set: { familyId, role } })
    .returning();
  if (!row) throw new Error("Invite not saved");
  return row;
}

export async function removeInvite(db: Db, familyId: string, id: string): Promise<boolean> {
  const rows = await db
    .delete(familyInvite)
    .where(and(eq(familyInvite.id, id), eq(familyInvite.familyId, familyId)))
    .returning({ id: familyInvite.id });
  return rows.length > 0;
}

/**
 * Removes a relative from the family; they count as signed out on their next request.
 * Owners stay: they come from NOTCH_ALLOWED_EMAILS.
 */
export async function removeMember(db: Db, familyId: string, userId: string): Promise<boolean> {
  const rows = await db
    .delete(familyMember)
    .where(
      and(
        eq(familyMember.familyId, familyId),
        eq(familyMember.userId, userId),
        ne(familyMember.role, "owner"),
      ),
    )
    .returning({ userId: familyMember.userId });
  return rows.length > 0;
}

/** Changes a relative's role; owners keep theirs. */
export async function setMemberRole(
  db: Db,
  familyId: string,
  userId: string,
  role: InviteRole,
): Promise<boolean> {
  const rows = await db
    .update(familyMember)
    .set({ role: z.enum(INVITE_ROLES).parse(role) })
    .where(
      and(
        eq(familyMember.familyId, familyId),
        eq(familyMember.userId, userId),
        ne(familyMember.role, "owner"),
      ),
    )
    .returning({ userId: familyMember.userId });
  return rows.length > 0;
}
