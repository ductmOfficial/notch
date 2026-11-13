import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import type { Db } from "./client.js";
import { appointment, child, measurement, vaccination, vaccineProduct } from "./schema.js";

const isoDate = z.iso.date();
const unique = (rows: readonly { productCode: string; doseNo: number }[]) =>
  new Set(rows.map((r) => `${r.productCode}#${String(r.doseNo)}`)).size === rows.length;
const text = (max: number) => z.string().max(max).nullable();
const grams = z.number().int().positive().max(60_000).nullable();
const millimetres = (max: number) => z.number().int().positive().max(max).nullable();

/**
 * A family's records as a JSON file (version 1). Values are stored as in the database
 * (grams, millimetres, product codes), so a backup restores without rounding. Ids are left
 * out: a restore creates fresh rows.
 */
export const backupSchema = z.object({
  format: z.literal("notch-backup"),
  version: z.literal(1),
  exportedAt: z.iso.datetime({ offset: true }),
  children: z
    .array(
      z
        .object({
          name: z.string().trim().min(1).max(60),
          sex: z.enum(["female", "male"]),
          birthDate: isoDate,
          birthTime: z.iso.time({ precision: -1 }).or(z.iso.time()).nullable(),
          measurements: z.array(
            z
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
              .refine((m) => m.weightG !== null || m.lengthMm !== null || m.headMm !== null),
          ),
          vaccinations: z.array(
            z.object({
              productCode: z.string().min(1),
              doseNo: z.number().int().min(1).max(20),
              givenOn: isoDate,
              place: text(200),
              lot: text(100),
              note: text(500),
            }),
          ),
          appointments: z.array(
            z.object({
              productCode: z.string().min(1),
              doseNo: z.number().int().min(1).max(20),
              dueOn: isoDate.nullable(),
              note: text(500),
            }),
          ),
        })
        // The database keeps one row per product and dose for each child.
        .refine((c) => unique(c.vaccinations) && unique(c.appointments)),
    )
    .max(20),
});

export type Backup = z.infer<typeof backupSchema>;

export interface RestoreResult {
  readonly children: number;
  readonly measurements: number;
  readonly vaccinations: number;
  readonly appointments: number;
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
  const [measurements, vaccinations, appointments] =
    ids.length === 0
      ? [[], [], []]
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
        ]);

  return {
    format: "notch-backup",
    version: 1,
    exportedAt: now.toISOString(),
    children: children.map((c) => ({
      name: c.name,
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
    })),
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
    }
    const total = (key: "measurements" | "vaccinations" | "appointments") =>
      data.children.reduce((sum, c) => sum + c[key].length, 0);
    return {
      children: data.children.length,
      measurements: total("measurements"),
      vaccinations: total("vaccinations"),
      appointments: total("appointments"),
    };
  });
}
