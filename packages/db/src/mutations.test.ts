import { CATALOG } from "@notch/vaccines";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { syncCatalog } from "./catalog.js";
import { createDb } from "./client.js";
import {
  addMeasurement,
  deleteAppointment,
  deleteMeasurement,
  deleteVaccination,
  DuplicateAppointmentError,
  DuplicateDoseError,
  getAppointment,
  getMeasurement,
  recordDose,
  saveAppointment,
  updateMeasurement,
} from "./mutations.js";
import { listAppointments, listMeasurements, listVaccinations } from "./queries.js";
import { child, family } from "./schema.js";

// Fixture only; not anyone's real record.
const handle = createDb("pglite:memory");
const { db } = handle;
let childId = "";
let otherChildId = "";

beforeAll(async () => {
  await handle.migrate();
  await syncCatalog(db, CATALOG);
  const [f] = await db.insert(family).values({ name: "Test family" }).returning();
  if (!f) throw new Error("family not created");
  const rows = await db
    .insert(child)
    .values([
      { familyId: f.id, name: "A", sex: "female", birthDate: "2030-01-01" },
      { familyId: f.id, name: "B", sex: "male", birthDate: "2031-01-01" },
    ])
    .returning();
  childId = rows[0]?.id ?? "";
  otherChildId = rows[1]?.id ?? "";
});

afterAll(async () => {
  await handle.close();
});

describe("measurements", () => {
  it("adds, reads, updates and deletes a measurement", async () => {
    const added = await addMeasurement(db, {
      childId,
      measuredOn: "2030-03-01",
      weightG: 5200,
      lengthMm: null,
      headMm: null,
      weightEstimated: true,
    });
    expect(added).toMatchObject({
      weightG: 5200,
      weightEstimated: true,
      lengthEstimated: false,
      note: null,
    });
    expect((await getMeasurement(db, added.id, childId))?.measuredOn).toBe("2030-03-01");

    const updated = await updateMeasurement(db, added.id, {
      childId,
      measuredOn: "2030-03-02",
      weightG: 5250,
      lengthMm: 575,
      headMm: null,
      note: "  after feeding  ",
    });
    expect(updated).toMatchObject({
      measuredOn: "2030-03-02",
      lengthMm: 575,
      weightEstimated: false,
      note: "after feeding",
    });

    expect(await deleteMeasurement(db, added.id, childId)).toBe(true);
    expect(await deleteMeasurement(db, added.id, childId)).toBe(false);
    expect(await listMeasurements(db, childId)).toEqual([]);
  });

  it("requires at least one value and plausible numbers", async () => {
    const base = { childId, measuredOn: "2030-03-01", weightG: null, lengthMm: null, headMm: null };
    await expect(addMeasurement(db, base)).rejects.toThrow("At least one");
    await expect(addMeasurement(db, { ...base, weightG: 0 })).rejects.toThrow();
    await expect(addMeasurement(db, { ...base, lengthMm: 99_999 })).rejects.toThrow();
    await expect(
      addMeasurement(db, { ...base, weightG: 5000, measuredOn: "01/03/2030" }),
    ).rejects.toThrow();
  });

  it("never touches another child's measurement", async () => {
    const own = await addMeasurement(db, {
      childId,
      measuredOn: "2030-04-01",
      weightG: 6000,
      lengthMm: null,
      headMm: null,
    });
    const input = {
      childId: otherChildId,
      measuredOn: "2030-04-01",
      weightG: 1,
      lengthMm: null,
      headMm: null,
    };
    expect(await updateMeasurement(db, own.id, input)).toBeUndefined();
    expect(await deleteMeasurement(db, own.id, otherChildId)).toBe(false);
    expect(await getMeasurement(db, own.id, otherChildId)).toBeUndefined();
    expect((await getMeasurement(db, own.id, childId))?.weightG).toBe(6000);
  });
});

describe("doses", () => {
  it("records a dose with the next appointment in one go", async () => {
    const { dose, nextAppointment } = await recordDose(db, {
      childId,
      productCode: "infanrix-hexa",
      doseNo: 1,
      givenOn: "2030-03-01",
      place: "Clinic",
      nextAppointment: { doseNo: 2, dueOn: "2030-04-01" },
    });
    expect(dose).toMatchObject({
      productCode: "infanrix-hexa",
      doseNo: 1,
      place: "Clinic",
      lot: null,
    });
    expect(nextAppointment).toMatchObject({
      productCode: "infanrix-hexa",
      doseNo: 2,
      dueOn: "2030-04-01",
    });
  });

  it("replaces the appointment for that dose when the clinic rebooks", async () => {
    await saveAppointment(db, { childId, productCode: "rotarix", doseNo: 2, dueOn: "2030-04-01" });
    await recordDose(db, {
      childId,
      productCode: "rotarix",
      doseNo: 1,
      givenOn: "2030-03-01",
      nextAppointment: { doseNo: 2, dueOn: "2030-04-15", note: "moved" },
    });
    const rotarix = (await listAppointments(db, childId)).filter(
      (a) => a.productCode === "rotarix",
    );
    expect(rotarix.map((a) => [a.doseNo, a.dueOn, a.note])).toEqual([[2, "2030-04-15", "moved"]]);
  });

  it("records a dose without an appointment", async () => {
    const { nextAppointment } = await recordDose(db, {
      childId,
      productCode: "bcg",
      doseNo: 1,
      givenOn: "2030-01-02",
    });
    expect(nextAppointment).toBeUndefined();
  });

  it("rejects a dose recorded twice and keeps the database unchanged", async () => {
    const before = (await listAppointments(db, childId)).length;
    await expect(
      recordDose(db, {
        childId,
        productCode: "bcg",
        doseNo: 1,
        givenOn: "2030-01-03",
        nextAppointment: { doseNo: 2, dueOn: "2030-06-01" },
      }),
    ).rejects.toBeInstanceOf(DuplicateDoseError);
    expect(await listAppointments(db, childId)).toHaveLength(before);
  });

  it("rejects unknown products", async () => {
    await expect(
      recordDose(db, { childId, productCode: "nope", doseNo: 1, givenOn: "2030-01-03" }),
    ).rejects.toThrow();
  });

  it("deletes only the child's own dose", async () => {
    const [bcg] = (await listVaccinations(db, childId)).filter((v) => v.productCode === "bcg");
    if (!bcg) throw new Error("missing dose");
    expect(await deleteVaccination(db, bcg.id, otherChildId)).toBe(false);
    expect(await deleteVaccination(db, bcg.id, childId)).toBe(true);
  });
});

describe("appointments", () => {
  it("creates, reschedules and deletes an appointment", async () => {
    const created = await saveAppointment(db, {
      childId,
      productCode: "bexsero",
      doseNo: 3,
      dueOn: null,
      note: "after 1 year",
    });
    if (!created) throw new Error("not created");
    expect(created).toMatchObject({ dueOn: null, note: "after 1 year" });

    const moved = await saveAppointment(
      db,
      { childId, productCode: "bexsero", doseNo: 3, dueOn: "2031-01-10" },
      created.id,
    );
    expect(moved).toMatchObject({ id: created.id, dueOn: "2031-01-10", note: null });
    expect((await getAppointment(db, created.id, childId))?.dueOn).toBe("2031-01-10");
    expect(await getAppointment(db, created.id, otherChildId)).toBeUndefined();

    expect(await deleteAppointment(db, created.id, otherChildId)).toBe(false);
    expect(await deleteAppointment(db, created.id, childId)).toBe(true);
  });

  it("rejects a second appointment for the same dose", async () => {
    await saveAppointment(db, {
      childId,
      productCode: "menquadfi",
      doseNo: 2,
      dueOn: "2031-02-01",
    });
    await expect(
      saveAppointment(db, { childId, productCode: "menquadfi", doseNo: 2, dueOn: "2031-03-01" }),
    ).rejects.toBeInstanceOf(DuplicateAppointmentError);
  });

  it("does not update another child's appointment", async () => {
    const own = await saveAppointment(db, {
      childId,
      productCode: "vaxigrip",
      doseNo: 2,
      dueOn: "2031-01-01",
    });
    if (!own) throw new Error("not created");
    expect(
      await saveAppointment(
        db,
        { childId: otherChildId, productCode: "vaxigrip", doseNo: 2, dueOn: "2031-05-05" },
        own.id,
      ),
    ).toBeUndefined();
  });
});
