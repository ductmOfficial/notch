import type { Catalog } from "@notch/vaccines";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";

import type { Db } from "./client.js";
import { appointment, child, family, measurement, vaccination } from "./schema.js";

const isoDate = z.iso.date();

/** Shape of a seed file: one child with their records, values in kg and cm. */
export const seedFileSchema = z.object({
  child: z.object({
    name: z.string().min(1),
    sex: z.enum(["male", "female"]),
    birthDate: isoDate,
    birthTime: z.iso.time({ precision: -1 }).optional(),
  }),
  measurements: z.array(
    z.object({
      date: isoDate,
      weightKg: z.number().positive().optional(),
      lengthCm: z.number().positive().optional(),
      headCm: z.number().positive().optional(),
      /** Values written as approximate ("~8,4"). */
      estimated: z.array(z.enum(["weight", "length", "head"])).optional(),
      note: z.string().optional(),
    }),
  ),
  vaccinations: z.array(
    z.object({
      product: z.string().min(1),
      doseNo: z.number().int().positive(),
      date: isoDate,
      place: z.string().optional(),
      note: z.string().optional(),
    }),
  ),
  appointments: z.array(
    z.object({
      product: z.string().min(1),
      doseNo: z.number().int().positive(),
      date: isoDate.nullable(),
      note: z.string().optional(),
    }),
  ),
});

export type SeedFile = z.infer<typeof seedFileSchema>;

export interface SeedOptions {
  /** Replace the records of an existing child. Without it, seeding a child that already has records fails. */
  readonly replace?: boolean;
}

/** Seeding would overwrite records that may have been entered in the app. */
export class SeedConflictError extends Error {
  constructor(name: string) {
    super(
      `${name} already has records in the database. Seeding again would replace them, including anything ` +
        "entered in the app. Run with --replace if that is what you want.",
    );
    this.name = "SeedConflictError";
  }
}

export interface SeedResult {
  readonly childId: string;
  readonly created: boolean;
  readonly measurements: number;
  readonly vaccinations: number;
  readonly appointments: number;
}

/**
 * Loads one child's records. The child is matched by name and birth date. A
 * new child is created with a family. An existing child without records is
 * filled in; one with records is only replaced (same id, records swapped)
 * when `replace` is set, otherwise a SeedConflictError is thrown so data
 * entered in the app is never lost by re-running the seed.
 * Products are matched by code or by name, case-insensitively.
 */
export async function seedChild(
  db: Db,
  catalog: Catalog,
  input: unknown,
  options: SeedOptions = {},
): Promise<SeedResult> {
  const data = seedFileSchema.parse(input);
  const products = new Map<string, string>();
  for (const p of catalog.products) {
    products.set(p.code.toLowerCase(), p.code);
    products.set(p.name.toLowerCase(), p.code);
  }
  const productCode = (name: string) => {
    const code = products.get(name.toLowerCase());
    if (!code) throw new Error(`Unknown vaccine product "${name}"; add it to the catalog first`);
    return code;
  };
  const toInt = (value: number | undefined, factor: number) =>
    value === undefined ? null : Math.round(value * factor);

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: child.id })
      .from(child)
      .where(and(eq(child.name, data.child.name), eq(child.birthDate, data.child.birthDate)));

    let childId: string;
    if (existing) {
      childId = existing.id;
      if (!options.replace) {
        const counts = await Promise.all(
          [measurement, vaccination, appointment].map((table) =>
            tx.select({ n: count() }).from(table).where(eq(table.childId, childId)),
          ),
        );
        if (counts.some(([row]) => (row?.n ?? 0) > 0)) throw new SeedConflictError(data.child.name);
      }
      await tx.delete(measurement).where(eq(measurement.childId, childId));
      await tx.delete(vaccination).where(eq(vaccination.childId, childId));
      await tx.delete(appointment).where(eq(appointment.childId, childId));
    } else {
      const [newFamily] = await tx
        .insert(family)
        .values({ name: `Gia đình ${data.child.name}` })
        .returning();
      if (!newFamily) throw new Error("Could not create family");
      const [newChild] = await tx
        .insert(child)
        .values({
          familyId: newFamily.id,
          name: data.child.name,
          sex: data.child.sex,
          birthDate: data.child.birthDate,
          birthTime: data.child.birthTime ?? null,
        })
        .returning();
      if (!newChild) throw new Error("Could not create child");
      childId = newChild.id;
    }

    if (data.measurements.length > 0) {
      await tx.insert(measurement).values(
        data.measurements.map((m) => ({
          childId,
          measuredOn: m.date,
          weightG: toInt(m.weightKg, 1000),
          lengthMm: toInt(m.lengthCm, 10),
          headMm: toInt(m.headCm, 10),
          weightEstimated: m.estimated?.includes("weight") ?? false,
          lengthEstimated: m.estimated?.includes("length") ?? false,
          headEstimated: m.estimated?.includes("head") ?? false,
          note: m.note ?? null,
        })),
      );
    }
    if (data.vaccinations.length > 0) {
      await tx.insert(vaccination).values(
        data.vaccinations.map((v) => ({
          childId,
          productCode: productCode(v.product),
          doseNo: v.doseNo,
          givenOn: v.date,
          place: v.place ?? null,
          note: v.note ?? null,
        })),
      );
    }
    if (data.appointments.length > 0) {
      await tx.insert(appointment).values(
        data.appointments.map((a) => ({
          childId,
          productCode: productCode(a.product),
          doseNo: a.doseNo,
          dueOn: a.date,
          note: a.note ?? null,
        })),
      );
    }

    return {
      childId,
      created: !existing,
      measurements: data.measurements.length,
      vaccinations: data.vaccinations.length,
      appointments: data.appointments.length,
    };
  });
}
