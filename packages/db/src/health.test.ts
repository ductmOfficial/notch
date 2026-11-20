import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { createDb } from "./client.js";
import {
  addHealthEntry,
  addTemperature,
  deleteHealthEntry,
  deleteTemperature,
  getHealthEntry,
  getTemperature,
  listHealthEntries,
  listTemperatures,
  UnknownHealthEntryError,
  updateHealthEntry,
  updateTemperature,
} from "./health.js";
import { addChild } from "./mutations.js";
import { child, family, healthEntry, temperature } from "./schema.js";

const handle = createDb("pglite:memory");
const { db } = handle;
let childId = "";
let otherChildId = "";

beforeAll(async () => {
  await handle.migrate();
  const [f] = await db.insert(family).values({ name: "Test family" }).returning();
  const familyId = f?.id ?? "";
  childId = (await addChild(db, { familyId, name: "Mây", sex: "female", birthDate: "2030-01-01" }))
    .id;
  otherChildId = (
    await addChild(db, { familyId, name: "Other", sex: "male", birthDate: "2031-01-01" })
  ).id;
});

afterAll(async () => {
  await handle.close();
});

const fever = {
  kind: "illness",
  title: "  Fever ",
  startedOn: "2030-06-01",
  endedOn: "2030-06-04",
  note: "after daycare",
} as const;

describe("health entries", () => {
  it("adds, reads and lists a child's entries, the most recent first", async () => {
    const first = await addHealthEntry(db, { childId, ...fever });
    expect(first).toMatchObject({ kind: "illness", title: "Fever", endedOn: "2030-06-04" });
    const visit = await addHealthEntry(db, {
      childId,
      kind: "visit",
      title: "Check-up",
      startedOn: "2030-07-10",
    });
    expect(visit).toMatchObject({ endedOn: null, note: null });
    await addHealthEntry(db, {
      childId: otherChildId,
      kind: "medication",
      title: "Drops",
      startedOn: "2030-08-01",
    });

    expect((await listHealthEntries(db, childId)).map((e) => e.title)).toEqual([
      "Check-up",
      "Fever",
    ]);
    expect(await getHealthEntry(db, first.id, childId)).toEqual(first);
    expect(await getHealthEntry(db, first.id, otherChildId)).toBeUndefined();
  });

  it("refuses an end before the start, unknown kinds and empty titles", async () => {
    const bad = [
      { ...fever, endedOn: "2030-05-31" },
      { ...fever, kind: "diagnosis" },
      { ...fever, title: "   " },
      { ...fever, startedOn: "2030-02-30" },
    ];
    for (const input of bad) {
      await expect(addHealthEntry(db, { childId, ...input } as never)).rejects.toBeInstanceOf(
        ZodError,
      );
    }
  });

  it("updates and deletes only the child's own entry", async () => {
    const entry = await addHealthEntry(db, { childId, ...fever, endedOn: null });
    const input = { childId, ...fever, endedOn: "2030-06-03" };
    expect(await updateHealthEntry(db, entry.id, { ...input, childId: otherChildId })).toBe(
      undefined,
    );
    expect(await updateHealthEntry(db, entry.id, input)).toMatchObject({ endedOn: "2030-06-03" });
    expect(await deleteHealthEntry(db, entry.id, otherChildId)).toBe(false);
    expect(await deleteHealthEntry(db, entry.id, childId)).toBe(true);
    expect(await getHealthEntry(db, entry.id, childId)).toBeUndefined();
  });
});

describe("temperatures", () => {
  it("records readings in tenths of a degree, oldest first, per entry when asked", async () => {
    const illness = await addHealthEntry(db, { childId, ...fever });
    const later = await addTemperature(db, {
      childId,
      measuredAt: "2030-06-01T20:00:00+07:00",
      tenthsC: 385,
      healthEntryId: illness.id,
    });
    const earlier = await addTemperature(db, {
      childId,
      measuredAt: "2030-06-01T08:30:00+07:00",
      tenthsC: 372,
    });
    expect(later.measuredAt.toISOString()).toBe("2030-06-01T13:00:00.000Z");
    expect(earlier).toMatchObject({ healthEntryId: null, note: null });

    const all = await listTemperatures(db, childId);
    expect(all.map((t) => t.tenthsC)).toEqual([372, 385]);
    expect((await listTemperatures(db, childId, illness.id)).map((t) => t.id)).toEqual([later.id]);
    expect(await listTemperatures(db, otherChildId)).toEqual([]);
  });

  it("refuses readings outside 34.0 to 43.0 °C and times without an offset", async () => {
    const base = { childId, measuredAt: "2030-06-01T08:00:00+07:00", tenthsC: 370 };
    for (const input of [
      { ...base, tenthsC: 339 },
      { ...base, tenthsC: 431 },
      { ...base, tenthsC: 37.5 },
      { ...base, measuredAt: "2030-06-01T08:00:00" },
    ]) {
      await expect(addTemperature(db, input)).rejects.toBeInstanceOf(ZodError);
    }
  });

  it("refuses a health entry of another child", async () => {
    const theirs = await addHealthEntry(db, {
      childId: otherChildId,
      kind: "illness",
      title: "Cold",
      startedOn: "2030-09-01",
    });
    const input = {
      childId,
      measuredAt: "2030-09-01T08:00:00+07:00",
      tenthsC: 380,
      healthEntryId: theirs.id,
    };
    await expect(addTemperature(db, input)).rejects.toBeInstanceOf(UnknownHealthEntryError);
    const own = await addTemperature(db, { ...input, healthEntryId: null });
    await expect(updateTemperature(db, own.id, input)).rejects.toBeInstanceOf(
      UnknownHealthEntryError,
    );
    expect(await getTemperature(db, own.id, childId)).toMatchObject({ healthEntryId: null });
  });

  it("keeps readings when their entry is deleted, and drops them with the child", async () => {
    const illness = await addHealthEntry(db, { childId: otherChildId, ...fever });
    const reading = await addTemperature(db, {
      childId: otherChildId,
      measuredAt: "2030-06-02T08:00:00+07:00",
      tenthsC: 390,
      healthEntryId: illness.id,
    });
    await deleteHealthEntry(db, illness.id, otherChildId);
    expect(await getTemperature(db, reading.id, otherChildId)).toMatchObject({
      healthEntryId: null,
      tenthsC: 390,
    });

    await db.delete(child).where(eq(child.id, otherChildId));
    expect(await getTemperature(db, reading.id, otherChildId)).toBeUndefined();
    expect(await listHealthEntries(db, otherChildId)).toEqual([]);
  });

  it("updates and deletes only the child's own reading", async () => {
    const reading = await addTemperature(db, {
      childId,
      measuredAt: "2030-10-01T08:00:00+07:00",
      tenthsC: 375,
    });
    const input = { childId, measuredAt: "2030-10-01T08:05:00+07:00", tenthsC: 376 };
    expect(await updateTemperature(db, reading.id, input)).toMatchObject({ tenthsC: 376 });
    expect(await deleteTemperature(db, reading.id, "00000000-0000-4000-8000-000000000000")).toBe(
      false,
    );
    expect(await deleteTemperature(db, reading.id, childId)).toBe(true);
  });
});

describe("database checks", () => {
  it("rejects rows that bypass validation", async () => {
    await expect(
      db.insert(healthEntry).values({
        childId,
        kind: "illness",
        title: "x",
        startedOn: "2030-02-02",
        endedOn: "2030-02-01",
      }),
    ).rejects.toThrow();
    await expect(
      db.insert(temperature).values({ childId, measuredAt: new Date(), tenthsC: 500 }),
    ).rejects.toThrow();
  });
});
