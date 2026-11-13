import { CATALOG } from "@notch/vaccines";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { BackupFormatError, exportBackup, restoreBackup } from "./backup.js";
import { syncCatalog } from "./catalog.js";
import { createDb } from "./client.js";
import { addChild, addMeasurement, recordDose, saveAppointment } from "./mutations.js";
import { listChildren } from "./queries.js";
import { family } from "./schema.js";

const handle = createDb("pglite:memory");
const { db } = handle;
let familyId = "";
let otherFamilyId = "";

beforeAll(async () => {
  await handle.migrate();
  await syncCatalog(db, CATALOG);
  const [f, g] = await db
    .insert(family)
    .values([{ name: "A" }, { name: "B" }])
    .returning();
  familyId = f?.id ?? "";
  otherFamilyId = g?.id ?? "";
  const c = await addChild(db, { familyId, name: "Test", sex: "female", birthDate: "2030-01-01" });
  await addMeasurement(db, {
    childId: c.id,
    measuredOn: "2030-02-01",
    weightG: 4250,
    lengthMm: 551,
    headMm: null,
    weightEstimated: true,
    note: "clinic scale",
  });
  const product = CATALOG.products[0]?.code ?? "";
  await recordDose(db, {
    childId: c.id,
    productCode: product,
    doseNo: 1,
    givenOn: "2030-03-01",
    place: "Clinic",
    lot: "A123",
    nextAppointment: { doseNo: 2, dueOn: "2030-04-01" },
  });
  await saveAppointment(db, {
    childId: c.id,
    productCode: product,
    doseNo: 3,
    dueOn: null,
    note: "after 1",
  });
  await addChild(db, {
    familyId: otherFamilyId,
    name: "Other",
    sex: "male",
    birthDate: "2031-01-01",
  });
});

afterAll(async () => {
  await handle.close();
});

describe("backup", () => {
  it("exports only the family's records, in stored units", async () => {
    const backup = await exportBackup(db, familyId, new Date("2030-05-01T00:00:00Z"));
    expect(backup).toMatchObject({
      format: "notch-backup",
      version: 1,
      exportedAt: "2030-05-01T00:00:00.000Z",
    });
    expect(backup.children.map((c) => c.name)).toEqual(["Test"]);
    expect(backup.children[0]?.measurements[0]).toMatchObject({
      weightG: 4250,
      lengthMm: 551,
      weightEstimated: true,
    });
    expect(backup.children[0]?.vaccinations[0]).toMatchObject({ lot: "A123", place: "Clinic" });
    expect(backup.children[0]?.appointments).toHaveLength(2);
  });

  it("restores a backup exactly, replacing the family's data and nothing else", async () => {
    const before = await exportBackup(db, familyId, new Date(0));
    const result = await restoreBackup(db, familyId, JSON.parse(JSON.stringify(before)));
    expect(result).toEqual({ children: 1, measurements: 1, vaccinations: 1, appointments: 2 });
    expect(await exportBackup(db, familyId, new Date(0))).toEqual(before);
    expect((await listChildren(db, otherFamilyId)).map((c) => c.name)).toEqual(["Other"]);
  });

  it("restores an empty backup as a family without children", async () => {
    const saved = await exportBackup(db, familyId);
    await restoreBackup(db, familyId, { ...saved, children: [] });
    expect(await listChildren(db, familyId)).toEqual([]);
    await restoreBackup(db, familyId, saved);
    expect(await listChildren(db, familyId)).toHaveLength(1);
  });

  it("refuses other files and leaves the data untouched", async () => {
    const saved = await exportBackup(db, familyId, new Date(0));
    const bad = [
      null,
      { format: "something", version: 1, exportedAt: saved.exportedAt, children: [] },
      { ...saved, version: 2 },
      { ...saved, children: [{ ...saved.children[0], sex: "other" }] },
    ];
    for (const input of bad) {
      await expect(restoreBackup(db, familyId, input)).rejects.toBeInstanceOf(BackupFormatError);
    }
    const unknown = structuredClone(saved);
    const first = unknown.children[0]?.vaccinations[0];
    if (first) first.productCode = "nope";
    await expect(restoreBackup(db, familyId, unknown)).rejects.toThrow(
      'Unknown vaccine product "nope"',
    );
    const duplicate = structuredClone(saved);
    const c = duplicate.children[0];
    if (c?.vaccinations[0]) c.vaccinations.push({ ...c.vaccinations[0] });
    await expect(restoreBackup(db, familyId, duplicate)).rejects.toBeInstanceOf(BackupFormatError);
    expect(await exportBackup(db, familyId, new Date(0))).toEqual(saved);
  });
});
