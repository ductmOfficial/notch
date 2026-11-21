import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import type { Db } from "./client.js";
import { TEMPERATURE_RANGE } from "./health.js";
import {
  appointment,
  child,
  healthEntry,
  measurement,
  temperature,
  vaccination,
  vaccineProduct,
} from "./schema.js";

const isoDate = z.iso.date();
const unique = (rows: readonly { productCode: string; doseNo: number }[]) =>
  new Set(rows.map((r) => `${r.productCode}#${String(r.doseNo)}`)).size === rows.length;
const text = (max: number) => z.string().max(max).nullable();
const grams = z.number().int().positive().max(60_000).nullable();
const millimetres = (max: number) => z.number().int().positive().max(max).nullable();

const measurementSchema = z
  .object({
    measuredOn: isoDate,
    weightG: grams,
    lengthMm: millimetres(1_500),
    headMm: millimetres(700),
    position: z.enum(["lying", "standing"]).nullable(),
    weightEstimated: z.boolean(),
    lengthEstimated: z.boolean(),
    headEstimated: z.boolean(),
    note: text(500),
  })
  .refine((m) => m.weightG !== null || m.lengthMm !== null || m.headMm !== null);

const vaccinationSchema = z.object({
  productCode: z.string().min(1),
  doseNo: z.number().int().min(1).max(20),
  givenOn: isoDate,
  place: text(200),
  lot: text(100),
  note: text(500),
});

const appointmentSchema = z.object({
  productCode: z.string().min(1),
  doseNo: z.number().int().min(1).max(20),
  dueOn: isoDate.nullable(),
  note: text(500),
});

const healthEntrySchema = z
  .object({
    kind: z.enum(["illness", "medication", "visit"]),
    title: z.string().trim().min(1).max(120),
    startedOn: isoDate,
    endedOn: isoDate.nullable(),
    note: text(500),
  })
  .refine((e) => e.endedOn === null || e.endedOn >= e.startedOn);

const temperatureSchema = z.object({
  measuredAt: z.iso.datetime({ offset: true }),
  tenthsC: z.number().int().min(TEMPERATURE_RANGE.min).max(TEMPERATURE_RANGE.max),
  /** Position of its health entry in the child's `healthEntries`, since backups hold no ids. */
  healthEntry: z.number().int().min(0).nullable(),
  note: text(500),
});

const childV1 = z.object({
  name: z.string().trim().min(1).max(60),
  sex: z.enum(["female", "male"]),
  birthDate: isoDate,
  birthTime: z.iso.time({ precision: -1 }).or(z.iso.time()).nullable(),
  measurements: z.array(measurementSchema),
  vaccinations: z.array(vaccinationSchema),
  appointments: z.array(appointmentSchema),
});

const childV2 = childV1.extend({
  healthEntries: z.array(healthEntrySchema).max(2_000),
  temperatures: z.array(temperatureSchema).max(10_000),
});

const childV3 = childV2.extend({
  fullName: text(100),
  englishName: text(100),
});

const header = {
  format: z.literal("notch-backup"),
  exportedAt: z.iso.datetime({ offset: true }),
};

// A temperature points at one of its child's health entries, by position.
const entriesExist = (c: z.infer<typeof childV2>) =>
  c.temperatures.every((t) => t.healthEntry === null || t.healthEntry < c.healthEntries.length);

// The database keeps one row per product and dose for each child.
const oneRowPerDose = (c: z.infer<typeof childV1>) =>
  unique(c.vaccinations) && unique(c.appointments);

/**
 * A family's records as a JSON file. Values are stored as in the database (grams,
 * millimetres, tenths of a degree, product codes), so a backup restores without rounding.
 * Ids are left out: a restore creates fresh rows.
 *
 * Version 2 adds the health log, version 3 the birth-certificate and English names. Older
 * files still restore: their children come back without what their version did not hold.
 */
export const backupSchema = z
  .discriminatedUnion("version", [
    z.object({
      ...header,
      version: z.literal(1),
      children: z.array(childV1.refine(oneRowPerDose)).max(20),
    }),
    z.object({
      ...header,
      version: z.literal(2),
      children: z.array(childV2.refine(oneRowPerDose).refine(entriesExist)).max(20),
    }),
    z.object({
      ...header,
      version: z.literal(3),
      children: z.array(childV3.refine(oneRowPerDose).refine(entriesExist)).max(20),
    }),
  ])
  .transform((b): Backup => ({
    ...b,
    version: 3,
    children: b.children.map((c) => ({
      healthEntries: [],
      temperatures: [],
      fullName: null,
      englishName: null,
      ...c,
    })),
  }));

/** A backup in the current version, as written by `exportBackup`. */
export interface Backup {
  readonly format: "notch-backup";
  readonly version: 3;
  readonly exportedAt: string;
  readonly children: z.infer<typeof childV3>[];
}

export interface RestoreResult {
  readonly children: number;
  readonly measurements: number;
  readonly vaccinations: number;
  readonly appointments: number;
  readonly healthEntries: number;
  readonly temperatures: number;
}

/** The file is not a Notch backup, or not one this version can read. */
export class BackupFormatError extends Error {
  constructor(
    readonly reason: "format" | "product",
    /** The unknown product code, for "product". */
    readonly detail = "",
  ) {
    super(
      reason === "product"
        ? `Unknown vaccine product "${detail}" in the backup`
        : "Not a valid Notch backup",
    );
    this.name = "BackupFormatError";
  }
}

/** Every record of the family's children. */
export async function exportBackup(db: Db, familyId: string, now = new Date()): Promise<Backup> {
  const children = await db
    .select()
    .from(child)
    .where(eq(child.familyId, familyId))
    .orderBy(asc(child.birthDate), asc(child.createdAt));
  const ids = children.map((c) => c.id);
  const [measurements, vaccinations, appointments, entries, temperatures] =
    ids.length === 0
      ? [[], [], [], [], []]
      : await Promise.all([
          db
            .select()
            .from(measurement)
            .where(inArray(measurement.childId, ids))
            .orderBy(asc(measurement.measuredOn), asc(measurement.createdAt)),
          db
            .select()
            .from(vaccination)
            .where(inArray(vaccination.childId, ids))
            .orderBy(asc(vaccination.givenOn), asc(vaccination.productCode)),
          db
            .select()
            .from(appointment)
            .where(inArray(appointment.childId, ids))
            .orderBy(asc(appointment.productCode), asc(appointment.doseNo)),
          db
            .select()
            .from(healthEntry)
            .where(inArray(healthEntry.childId, ids))
            .orderBy(asc(healthEntry.startedOn), asc(healthEntry.createdAt), asc(healthEntry.id)),
          db
            .select()
            .from(temperature)
            .where(inArray(temperature.childId, ids))
            .orderBy(asc(temperature.measuredAt), asc(temperature.createdAt), asc(temperature.id)),
        ]);

  return {
    format: "notch-backup",
    version: 3,
    exportedAt: now.toISOString(),
    children: children.map((c) => {
      const own = entries.filter((e) => e.childId === c.id);
      const position = new Map(own.map((e, i) => [e.id, i]));
      return {
        name: c.name,
        fullName: c.fullName,
        englishName: c.englishName,
        sex: c.sex,
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        measurements: measurements
          .filter((m) => m.childId === c.id)
          .map((m) => ({
            measuredOn: m.measuredOn,
            weightG: m.weightG,
            lengthMm: m.lengthMm,
            headMm: m.headMm,
            position: m.position,
            weightEstimated: m.weightEstimated,
            lengthEstimated: m.lengthEstimated,
            headEstimated: m.headEstimated,
            note: m.note,
          })),
        vaccinations: vaccinations
          .filter((v) => v.childId === c.id)
          .map((v) => ({
            productCode: v.productCode,
            doseNo: v.doseNo,
            givenOn: v.givenOn,
            place: v.place,
            lot: v.lot,
            note: v.note,
          })),
        appointments: appointments
          .filter((a) => a.childId === c.id)
          .map((a) => ({
            productCode: a.productCode,
            doseNo: a.doseNo,
            dueOn: a.dueOn,
            note: a.note,
          })),
        healthEntries: own.map((e) => ({
          kind: e.kind,
          title: e.title,
          startedOn: e.startedOn,
          endedOn: e.endedOn,
          note: e.note,
        })),
        temperatures: temperatures
          .filter((t) => t.childId === c.id)
          .map((t) => ({
            measuredAt: t.measuredAt.toISOString(),
            tenthsC: t.tenthsC,
            healthEntry: t.healthEntryId === null ? null : (position.get(t.healthEntryId) ?? null),
            note: t.note,
          })),
      };
    }),
  };
}

/**
 * Replaces all of the family's children and records with those of a backup, in one
 * transaction: either everything is restored or nothing changes.
 */
export async function restoreBackup(
  db: Db,
  familyId: string,
  input: unknown,
): Promise<RestoreResult> {
  const parsed = backupSchema.safeParse(input);
  if (!parsed.success) throw new BackupFormatError("format");
  const data = parsed.data;

  const known = new Set(
    (await db.select({ code: vaccineProduct.code }).from(vaccineProduct)).map((p) => p.code),
  );
  for (const c of data.children) {
    for (const r of [...c.vaccinations, ...c.appointments]) {
      if (!known.has(r.productCode)) throw new BackupFormatError("product", r.productCode);
    }
  }

  return db.transaction(async (tx) => {
    // Records go with their child (on delete cascade).
    await tx.delete(child).where(eq(child.familyId, familyId));
    for (const c of data.children) {
      const [row] = await tx
        .insert(child)
        .values({
          familyId,
          name: c.name,
          fullName: c.fullName,
          englishName: c.englishName,
          sex: c.sex,
          birthDate: c.birthDate,
          birthTime: c.birthTime,
        })
        .returning({ id: child.id });
      if (!row) throw new Error("Child not restored");
      const childId = row.id;
      if (c.measurements.length > 0)
        await tx.insert(measurement).values(c.measurements.map((m) => ({ ...m, childId })));
      if (c.vaccinations.length > 0)
        await tx.insert(vaccination).values(c.vaccinations.map((v) => ({ ...v, childId })));
      if (c.appointments.length > 0)
        await tx.insert(appointment).values(c.appointments.map((a) => ({ ...a, childId })));
      // One by one, so each temperature can point at the id of its entry.
      const entryIds: string[] = [];
      for (const e of c.healthEntries) {
        const [saved] = await tx
          .insert(healthEntry)
          .values({ ...e, childId })
          .returning({ id: healthEntry.id });
        if (!saved) throw new Error("Health entry not restored");
        entryIds.push(saved.id);
      }
      if (c.temperatures.length > 0)
        await tx.insert(temperature).values(
          c.temperatures.map(({ healthEntry: at, measuredAt, ...t }) => ({
            ...t,
            childId,
            measuredAt: new Date(measuredAt),
            healthEntryId: at === null ? null : (entryIds[at] ?? null),
          })),
        );
    }
    const total = (
      key: "measurements" | "vaccinations" | "appointments" | "healthEntries" | "temperatures",
    ) => data.children.reduce((sum, c) => sum + c[key].length, 0);
    return {
      children: data.children.length,
      measurements: total("measurements"),
      vaccinations: total("vaccinations"),
      appointments: total("appointments"),
      healthEntries: total("healthEntries"),
      temperatures: total("temperatures"),
    };
  });
}
