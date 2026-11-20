import { count } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDb } from "./client.js";
import { familyForUser, familyIdForUser } from "./families.js";
import { addChild } from "./mutations.js";
import { family, familyMember, user } from "./schema.js";

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

describe("familyForUser", () => {
  it("returns the family and its children, oldest first, in one call", async () => {
    const familyId = await familyIdForUser(db, "u1");
    expect(await familyForUser(db, "u1")).toEqual({ familyId, children: [] });
    await addChild(db, { familyId, name: "Younger", sex: "male", birthDate: "2032-01-01" });
    await addChild(db, { familyId, name: "Mây", sex: "female", birthDate: "2030-01-01" });
    const result = await familyForUser(db, "u2");
    expect(result.familyId).toBe(familyId);
    expect(result.children.map((c) => c.name)).toEqual(["Mây", "Younger"]);
  });

  it("joins a family first for a new user", async () => {
    await db.insert(user).values({ id: "u4", name: "", email: "four@example.com" });
    const result = await familyForUser(db, "u4");
    expect(result.familyId).toBe(await familyIdForUser(db, "u1"));
    expect(result.children).toHaveLength(2);
  });
});
