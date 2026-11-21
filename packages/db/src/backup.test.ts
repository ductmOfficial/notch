import { CATALOG } from "@notch/vaccines";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { BackupFormatError, exportBackup, restoreBackup } from "./backup.js";
import { syncCatalog } from "./catalog.js";
import { createDb } from "./client.js";
import { addHealthEntry, addTemperature, listHealthEntries, listTemperatures } from "./health.js";
import { addChild, addMeasurement, recordDose, saveAppointment, updateChild } from "./mutations.js";
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
  await updateChild(db, familyId, c.id, {
    name: "Test",
    fullName: "Nguyễn Thị Test",
    englishName: "Tess",
    sex: "female",
    birthDate: "2030-01-01",
    birthTime: "08:40",
  });
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
  const fever = await addHealthEntry(db, {
    childId: c.id,
    kind: "illness",
    title: "Fever",
    startedOn: "2030-03-02",
    endedOn: "2030-03-03",
  });
  await addHealthEntry(db, {
    childId: c.id,
    kind: "visit",
    title: "Check-up",
    startedOn: "2030-01-15",
  });
  await addTemperature(db, {
    childId: c.id,
    measuredAt: "2030-03-02T21:00:00+07:00",
    tenthsC: 384,
    healthEntryId: fever.id,
    note: "after the dose",
  });
  await addTemperature(db, {
    childId: c.id,
    measuredAt: "2030-02-01T08:00:00+07:00",
    tenthsC: 368,
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
      version: 3,
      exportedAt: "2030-05-01T00:00:00.000Z",
    });
    expect(backup.children.map((c) => c.name)).toEqual(["Test"]);
    expect(backup.children[0]).toMatchObject({
      fullName: "Nguyễn Thị Test",
      englishName: "Tess",
      birthTime: "08:40:00",
    });
    expect(backup.children[0]?.measurements[0]).toMatchObject({
      weightG: 4250,
      lengthMm: 551,
      weightEstimated: true,
    });
    expect(backup.children[0]?.vaccinations[0]).toMatchObject({ lot: "A123", place: "Clinic" });
    expect(backup.children[0]?.appointments).toHaveLength(2);
    // Entries oldest first; a temperature points at its entry by position, not by id.
    expect(backup.children[0]?.healthEntries.map((e) => e.title)).toEqual(["Check-up", "Fever"]);
    expect(backup.children[0]?.temperatures).toEqual([
      { measuredAt: "2030-02-01T01:00:00.000Z", tenthsC: 368, healthEntry: null, note: null },
      {
        measuredAt: "2030-03-02T14:00:00.000Z",
        tenthsC: 384,
        healthEntry: 1,
        note: "after the dose",
      },
    ]);
  });

  it("restores a backup exactly, replacing the family's data and nothing else", async () => {
    const before = await exportBackup(db, familyId, new Date(0));
    const result = await restoreBackup(db, familyId, JSON.parse(JSON.stringify(before)));
    expect(result).toEqual({
      children: 1,
      measurements: 1,
      vaccinations: 1,
      appointments: 2,
      healthEntries: 2,
      temperatures: 2,
    });
    expect(await exportBackup(db, familyId, new Date(0))).toEqual(before);
    // The reading still belongs to the restored fever, under its new id.
    const [restored] = await listChildren(db, familyId);
    const entries = await listHealthEntries(db, restored?.id ?? "");
    const fever = entries.find((e) => e.title === "Fever");
    expect(fever).toBeDefined();
    const readings = await listTemperatures(db, restored?.id ?? "", fever?.id);
    expect(readings.map((t) => t.tenthsC)).toEqual([384]);
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
      { ...saved, version: 4 },
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
    const dangling = structuredClone(saved);
    const reading = dangling.children[0]?.temperatures[0];
    if (reading) reading.healthEntry = 9;
    await expect(restoreBackup(db, familyId, dangling)).rejects.toBeInstanceOf(BackupFormatError);
    const hot = structuredClone(saved);
    const t = hot.children[0]?.temperatures[0];
    if (t) t.tenthsC = 500;
    await expect(restoreBackup(db, familyId, hot)).rejects.toBeInstanceOf(BackupFormatError);
    expect(await exportBackup(db, familyId, new Date(0))).toEqual(saved);
  });

  it("still restores a version 1 file, written before the health log", async () => {
    const saved = await exportBackup(db, familyId, new Date(0));
    const v1 = {
      ...saved,
      version: 1,
      children: saved.children.map(({ healthEntries, temperatures, ...c }) => {
        expect(healthEntries.length + temperatures.length).toBeGreaterThan(0);
        return c;
      }),
    };
    const result = await restoreBackup(db, familyId, JSON.parse(JSON.stringify(v1)));
    expect(result).toMatchObject({
      children: 1,
      measurements: 1,
      healthEntries: 0,
      temperatures: 0,
    });
    const after = await exportBackup(db, familyId, new Date(0));
    expect(after.version).toBe(3);
    expect(after.children[0]).toEqual({
      ...v1.children[0],
      healthEntries: [],
      temperatures: [],
      fullName: null,
      englishName: null,
    });
    // A version 1 file replaces everything, so it holds no health log to bring back.
    await restoreBackup(db, familyId, saved);
    expect(await exportBackup(db, familyId, new Date(0))).toEqual(saved);
  });

  it("still restores a version 2 file, written before the extra names", async () => {
    const saved = await exportBackup(db, familyId, new Date(0));
    const v2 = {
      ...saved,
      version: 2,
      children: saved.children.map(({ fullName, englishName, ...c }) => {
        expect(fullName ?? englishName).not.toBeNull();
        return c;
      }),
    };
    await restoreBackup(db, familyId, JSON.parse(JSON.stringify(v2)));
    const after = await exportBackup(db, familyId, new Date(0));
    expect(after.children[0]).toMatchObject({ name: "Test", fullName: null, englishName: null });
    expect(after.children[0]?.healthEntries).toEqual(saved.children[0]?.healthEntries);
    await restoreBackup(db, familyId, saved);
    expect(await exportBackup(db, familyId, new Date(0))).toEqual(saved);
  });
});
