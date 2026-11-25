import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDb } from "./client.js";
import { addChild } from "./mutations.js";
import { child, family, shareLink } from "./schema.js";
import {
  childForShareToken,
  createShareLink,
  isShareLinkActive,
  listShareLinks,
  revokeShareLink,
} from "./share-links.js";

const handle = createDb("pglite:memory");
const { db } = handle;
let familyId = "";
let otherFamilyId = "";
let childId = "";

const NOW = new Date("2030-06-01T03:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

beforeAll(async () => {
  await handle.migrate();
  const [f, other] = await db
    .insert(family)
    .values([{ name: "Test family" }, { name: "Other family" }])
    .returning();
  familyId = f?.id ?? "";
  otherFamilyId = other?.id ?? "";
  childId = (await addChild(db, { familyId, name: "Test", sex: "female", birthDate: "2030-01-01" }))
    .id;
});

afterAll(async () => {
  await handle.close();
});

describe("share links", () => {
  it("opens the child's page until it expires", async () => {
    const link = await createShareLink(db, familyId, childId, "week", NOW);
    expect(link?.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(link?.expiresAt).toEqual(new Date(NOW.getTime() + 7 * DAY));
    const token = link?.token ?? "";

    const opened = await childForShareToken(db, token, NOW);
    expect(opened?.child).toMatchObject({ id: childId, name: "Test" });
    expect(opened?.expiresAt).toEqual(link?.expiresAt);
    const [listed] = await listShareLinks(db, familyId);
    expect(listed?.lastViewedAt).toEqual(NOW);

    const later = new Date(NOW.getTime() + 7 * DAY);
    expect(await childForShareToken(db, token, later)).toBeUndefined();
    expect(listed && isShareLinkActive(listed, later)).toBe(false);
    expect(listed && isShareLinkActive(listed, NOW)).toBe(true);
  });

  it("lasts a month, or until revoked", async () => {
    const month = await createShareLink(db, familyId, childId, "month", NOW);
    expect(month?.expiresAt).toEqual(new Date(NOW.getTime() + 30 * DAY));
    const never = await createShareLink(db, familyId, childId, "never", NOW);
    expect(never?.expiresAt).toBeNull();
    const farAway = new Date("2099-01-01T00:00:00Z");
    expect((await childForShareToken(db, never?.token ?? "", farAway))?.child.id).toBe(childId);
    expect(never && isShareLinkActive(never, farAway)).toBe(true);
  });

  it("keeps one link per child: a new one replaces the old", async () => {
    const first = await createShareLink(db, familyId, childId, "never", NOW);
    const second = await createShareLink(db, familyId, childId, "never", NOW);
    expect(second?.token).not.toBe(first?.token);
    expect(second?.lastViewedAt).toBeNull();
    expect(await childForShareToken(db, first?.token ?? "", NOW)).toBeUndefined();
    expect(await db.select().from(shareLink)).toHaveLength(1);
  });

  it("stops working once revoked", async () => {
    const link = await createShareLink(db, familyId, childId, "never", NOW);
    expect(await revokeShareLink(db, familyId, childId)).toBe(true);
    expect(await revokeShareLink(db, familyId, childId)).toBe(false);
    expect(await childForShareToken(db, link?.token ?? "", NOW)).toBeUndefined();
    expect(await listShareLinks(db, familyId)).toEqual([]);
  });

  it("touches only the family's own children", async () => {
    expect(await createShareLink(db, otherFamilyId, childId, "week", NOW)).toBeUndefined();
    await createShareLink(db, familyId, childId, "week", NOW);
    expect(await revokeShareLink(db, otherFamilyId, childId)).toBe(false);
    expect(await listShareLinks(db, otherFamilyId)).toEqual([]);
    expect(await listShareLinks(db, familyId)).toHaveLength(1);
  });

  it("ignores malformed and unknown tokens", async () => {
    expect(await childForShareToken(db, "nope", NOW)).toBeUndefined();
    expect(await childForShareToken(db, "a".repeat(43), NOW)).toBeUndefined();
  });

  it("goes away with the child", async () => {
    const link = await createShareLink(db, familyId, childId, "never", NOW);
    await db.delete(child);
    expect(await childForShareToken(db, link?.token ?? "", NOW)).toBeUndefined();
    expect(await db.select().from(shareLink)).toEqual([]);
  });
});
