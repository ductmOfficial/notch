import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  calendarLinkInfo,
  createCalendarToken,
  familyIdForCalendarToken,
  revokeCalendarToken,
} from "./calendar-tokens.js";
import { createDb } from "./client.js";
import { calendarToken, family } from "./schema.js";

const handle = createDb("pglite:memory");
const { db } = handle;
let familyId = "";

beforeAll(async () => {
  await handle.migrate();
  const [f] = await db.insert(family).values({ name: "Test family" }).returning();
  familyId = f?.id ?? "";
});

afterAll(async () => {
  await handle.close();
});

describe("calendar tokens", () => {
  it("finds the family by its token and stores only a hash", async () => {
    const token = await createCalendarToken(db, familyId);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(await familyIdForCalendarToken(db, token)).toBe(familyId);
    const rows = await db.select().from(calendarToken);
    expect(JSON.stringify(rows)).not.toContain(token);
    expect((await calendarLinkInfo(db, familyId))?.lastUsedAt).toBeInstanceOf(Date);
  });

  it("replaces the old link when a new one is made", async () => {
    const first = await createCalendarToken(db, familyId);
    const second = await createCalendarToken(db, familyId);
    expect(await familyIdForCalendarToken(db, first)).toBeUndefined();
    expect(await familyIdForCalendarToken(db, second)).toBe(familyId);
    expect((await calendarLinkInfo(db, familyId))?.lastUsedAt).toBeInstanceOf(Date);
  });

  it("starts unused, and stops working once revoked", async () => {
    const token = await createCalendarToken(db, familyId);
    expect((await calendarLinkInfo(db, familyId))?.lastUsedAt).toBeNull();
    await revokeCalendarToken(db, familyId);
    expect(await familyIdForCalendarToken(db, token)).toBeUndefined();
    expect(await calendarLinkInfo(db, familyId)).toBeUndefined();
  });

  it("rejects malformed tokens without a query", async () => {
    expect(await familyIdForCalendarToken(db, "")).toBeUndefined();
    expect(await familyIdForCalendarToken(db, "../etc/passwd")).toBeUndefined();
  });
});
