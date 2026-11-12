import { CATALOG } from "@notch/vaccines";
import { asc, count } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { syncCatalog } from "./catalog.js";
import { createDb } from "./client.js";
import { listAppointments, listMeasurements, listVaccinations } from "./queries.js";
import { appointment, child, family, vaccination } from "./schema.js";
import { SeedConflictError, seedChild } from "./seed.js";

// Fixture only; real seed files live outside the repository.
const SEED = {
  child: { name: "Test", sex: "female", birthDate: "2030-01-01", birthTime: "08:30" },
  measurements: [
    { date: "2030-03-01", weightKg: 5.25, lengthCm: 57.5 },
    { date: "2030-04-01", weightKg: 6.1, lengthCm: 60, estimated: ["weight"], note: "approximate" },
  ],
  vaccinations: [
    { product: "Infanrix Hexa", doseNo: 1, date: "2030-03-01", place: "Clinic" },
    { product: "rotarix", doseNo: 1, date: "2030-03-01" },
  ],
  appointments: [
    { product: "INFANRIX HEXA", doseNo: 2, date: "2030-04-01" },
    { product: "Bexsero", doseNo: 3, date: null, note: "after the first birthday" },
  ],
};

const handle = createDb("pglite:memory");
const { db } = handle;

beforeAll(async () => {
  await handle.migrate();
  await syncCatalog(db, CATALOG);
});

afterAll(async () => {
  await handle.close();
});

/** Every child in the database, whatever its family (each seeded child may get its own). */
const allChildren = () => db.select().from(child).orderBy(asc(child.birthDate));

describe("seedChild", () => {
  it("creates a family and child with all records, converting units", async () => {
    const result = await seedChild(db, CATALOG, SEED);
    expect(result).toMatchObject({
      created: true,
      measurements: 2,
      vaccinations: 2,
      appointments: 2,
    });

    const [c] = await allChildren();
    expect(c).toMatchObject({
      name: "Test",
      sex: "female",
      birthDate: "2030-01-01",
      birthTime: "08:30:00",
    });
    const rows = await listMeasurements(db, result.childId);
    expect(
      rows.map((r) => [r.weightG, r.lengthMm, r.weightEstimated, r.lengthEstimated, r.note]),
    ).toEqual([
      [5250, 575, false, false, null],
      [6100, 600, true, false, "approximate"],
    ]);
  });

  it("lists doses by date and appointments with undated ones last", async () => {
    const [c] = await allChildren();
    if (!c) throw new Error("no child");
    expect(
      (await listVaccinations(db, c.id)).map((v) => [v.productCode, v.doseNo, v.givenOn]),
    ).toEqual([
      ["infanrix-hexa", 1, "2030-03-01"],
      ["rotarix", 1, "2030-03-01"],
    ]);
    expect((await listAppointments(db, c.id)).map((a) => [a.productCode, a.dueOn])).toEqual([
      ["infanrix-hexa", "2030-04-01"],
      ["bexsero", null],
    ]);
  });

  it("replaces the records of an existing child instead of duplicating", async () => {
    const first = await seedChild(db, CATALOG, SEED, { replace: true });
    const second = await seedChild(
      db,
      CATALOG,
      { ...SEED, measurements: SEED.measurements.slice(0, 1) },
      { replace: true },
    );
    expect(second).toMatchObject({ childId: first.childId, created: false, measurements: 1 });
    expect(await listMeasurements(db, first.childId)).toHaveLength(1);
    const [families] = await db.select({ n: count() }).from(family);
    const [doses] = await db.select({ n: count() }).from(vaccination);
    const [appointments] = await db.select({ n: count() }).from(appointment);
    expect([families?.n, doses?.n, appointments?.n]).toEqual([1, 2, 2]);
  });

  it("refuses to overwrite an existing child's records without replace", async () => {
    const id = (await allChildren()).find((c) => c.name === "Test")?.id ?? "";
    const countBefore = (await listMeasurements(db, id)).length;
    await expect(seedChild(db, CATALOG, SEED)).rejects.toBeInstanceOf(SeedConflictError);
    await expect(seedChild(db, CATALOG, SEED)).rejects.toThrow("--replace");
    expect(await listMeasurements(db, id)).toHaveLength(countBefore);
  });

  it("fills in an existing child that has no records yet", async () => {
    const empty = {
      child: { name: "Later", sex: "male", birthDate: "2031-06-01" },
      measurements: [],
      vaccinations: [],
      appointments: [],
    };
    const created = await seedChild(db, CATALOG, empty);
    const filled = await seedChild(db, CATALOG, {
      ...empty,
      measurements: [{ date: "2031-07-01", weightKg: 4.5 }],
    });
    expect(filled).toMatchObject({ childId: created.childId, created: false, measurements: 1 });
  });

  it("accepts a seed without records", async () => {
    const result = await seedChild(db, CATALOG, {
      child: { name: "Empty", sex: "male", birthDate: "2031-01-01" },
      measurements: [],
      vaccinations: [],
      appointments: [],
    });
    expect(result).toMatchObject({ created: true, measurements: 0 });
  });

  it("rejects unknown products and rolls back", async () => {
    const bad = {
      ...SEED,
      child: { ...SEED.child, name: "Bad" },
      vaccinations: [{ product: "Nope", doseNo: 1, date: "2030-03-01" }],
    };
    await expect(seedChild(db, CATALOG, bad)).rejects.toThrow('Unknown vaccine product "Nope"');
    expect((await allChildren()).map((c) => c.name)).not.toContain("Bad");
  });

  it("rejects malformed input", async () => {
    await expect(
      seedChild(db, CATALOG, { ...SEED, child: { ...SEED.child, birthDate: "01/01/2030" } }),
    ).rejects.toThrow();
    await expect(
      seedChild(db, CATALOG, { ...SEED, child: { ...SEED.child, sex: "x" } }),
    ).rejects.toThrow();
  });
});
