import { count } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDb } from "./client.js";
import {
  AlreadyMemberError,
  familyForUser,
  familyIdForUser,
  inviteMember,
  listInvites,
  listMembers,
  maySignIn,
  removeInvite,
  removeMember,
  setMemberRole,
  UnknownUserError,
} from "./families.js";
import { addChild } from "./mutations.js";
import { family, familyInvite, familyMember, user } from "./schema.js";

const handle = createDb("pglite:memory");
const { db } = handle;

beforeAll(async () => {
  await handle.migrate();
  await db.insert(user).values([
    { id: "u1", name: "", email: "one@example.com" },
    { id: "u2", name: "", email: "two@example.com" },
  ]);
});

afterAll(async () => {
  await handle.close();
});

describe("familyIdForUser", () => {
  it("creates the family for the first user when there is none", async () => {
    const id = await familyIdForUser(db, "u1");
    const [families] = await db.select({ n: count() }).from(family);
    expect(families?.n).toBe(1);
    expect(await familyIdForUser(db, "u1")).toBe(id);
  });

  it("puts the next user in the same family", async () => {
    const first = await familyIdForUser(db, "u1");
    expect(await familyIdForUser(db, "u2")).toBe(first);
    const [members] = await db.select({ n: count() }).from(familyMember);
    expect(members?.n).toBe(2);
  });

  it("joins the existing (seeded) family rather than creating one", async () => {
    const other = createDb("pglite:memory");
    try {
      await other.migrate();
      const [seeded] = await other.db.insert(family).values({ name: "Seeded" }).returning();
      await other.db.insert(user).values({ id: "u3", name: "", email: "three@example.com" });
      expect(await familyIdForUser(other.db, "u3")).toBe(seeded?.id);
    } finally {
      await other.close();
    }
  });
});

const OWNERS = new Set(["one@example.com", "two@example.com", "four@example.com"]);
const who = (id: string, email: string) => ({ id, email });

describe("a user the database does not have", () => {
  it("is refused without creating a family", async () => {
    const other = createDb("pglite:memory");
    try {
      await other.migrate();
      await expect(
        familyForUser(other.db, who("ghost", "one@example.com"), OWNERS),
      ).rejects.toBeInstanceOf(UnknownUserError);
      const [families] = await other.db.select({ n: count() }).from(family);
      expect(families?.n).toBe(0);
    } finally {
      await other.close();
    }
  });
});

describe("familyForUser", () => {
  it("returns the family, the role and the children, oldest first, in one call", async () => {
    const familyId = await familyIdForUser(db, "u1");
    expect(await familyForUser(db, who("u1", "one@example.com"), OWNERS)).toEqual({
      familyId,
      role: "owner",
      children: [],
    });
    await addChild(db, { familyId, name: "Younger", sex: "male", birthDate: "2032-01-01" });
    await addChild(db, { familyId, name: "Mây", sex: "female", birthDate: "2030-01-01" });
    const result = await familyForUser(db, who("u2", "Two@Example.com"), OWNERS);
    expect(result?.familyId).toBe(familyId);
    expect(result?.children.map((c) => c.name)).toEqual(["Mây", "Younger"]);
  });

  it("joins an owner to the household on first use", async () => {
    await db.insert(user).values({ id: "u4", name: "", email: "four@example.com" });
    const result = await familyForUser(db, who("u4", "four@example.com"), OWNERS);
    expect(result?.familyId).toBe(await familyIdForUser(db, "u1"));
    expect(result?.role).toBe("owner");
    expect(result?.children).toHaveLength(2);
  });

  it("signs out an owner whose address left the list", async () => {
    expect(await familyForUser(db, who("u4", "four@example.com"), new Set())).toBeUndefined();
  });

  it("turns an invite into a membership with its role", async () => {
    const familyId = await familyIdForUser(db, "u1");
    await db.insert(user).values({ id: "g1", name: "", email: "grandma@example.com" });
    // Not invited yet: no access, and no family is joined.
    expect(await familyForUser(db, who("g1", "grandma@example.com"), OWNERS)).toBeUndefined();
    expect(await maySignIn(db, "grandma@example.com", OWNERS)).toBe(false);

    await inviteMember(db, familyId, { email: " Grandma@Example.com ", role: "viewer" });
    expect(await maySignIn(db, "GRANDMA@example.com", OWNERS)).toBe(true);
    const joined = await familyForUser(db, who("g1", "grandma@example.com"), OWNERS);
    expect(joined).toMatchObject({ familyId, role: "viewer" });
    expect(joined?.children).toHaveLength(2);
    expect(await listInvites(db, familyId)).toEqual([]);
    // Still allowed after joining, through the membership.
    expect(await maySignIn(db, "grandma@example.com", OWNERS)).toBe(true);
  });
});

describe("managing members", () => {
  it("lists members and invites, and refuses to invite a member again", async () => {
    const familyId = await familyIdForUser(db, "u1");
    const members = await listMembers(db, familyId);
    expect(members.map((m) => [m.email, m.role])).toEqual([
      ["one@example.com", "owner"],
      ["two@example.com", "owner"],
      ["four@example.com", "owner"],
      ["grandma@example.com", "viewer"],
    ]);
    await expect(
      inviteMember(db, familyId, { email: "grandma@example.com", role: "editor" }),
    ).rejects.toBeInstanceOf(AlreadyMemberError);

    const first = await inviteMember(db, familyId, { email: "aunt@example.com", role: "viewer" });
    const again = await inviteMember(db, familyId, { email: "aunt@example.com", role: "editor" });
    expect(again.id).toBe(first.id);
    expect((await listInvites(db, familyId)).map((i) => [i.email, i.role])).toEqual([
      ["aunt@example.com", "editor"],
    ]);
    await expect(
      inviteMember(db, familyId, { email: "not an address", role: "viewer" }),
    ).rejects.toThrow();
    expect(await removeInvite(db, familyId, first.id)).toBe(true);
    expect(await removeInvite(db, familyId, first.id)).toBe(false);
    const [invites] = await db.select({ n: count() }).from(familyInvite);
    expect(invites?.n).toBe(0);
  });

  it("changes and removes relatives, never owners", async () => {
    const familyId = await familyIdForUser(db, "u1");
    expect(await setMemberRole(db, familyId, "g1", "editor")).toBe(true);
    expect(await setMemberRole(db, familyId, "u1", "viewer")).toBe(false);
    expect((await familyForUser(db, who("g1", "grandma@example.com"), OWNERS))?.role).toBe(
      "editor",
    );
    expect(await removeMember(db, familyId, "u1")).toBe(false);
    expect(await removeMember(db, familyId, "g1")).toBe(true);
    // Removed: no access, no new link.
    expect(await familyForUser(db, who("g1", "grandma@example.com"), OWNERS)).toBeUndefined();
    expect(await maySignIn(db, "grandma@example.com", OWNERS)).toBe(false);
    const [rows] = await db.select({ n: count() }).from(familyMember);
    expect(rows?.n).toBe(3);
  });
});
