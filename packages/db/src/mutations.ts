import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import type { Db } from "./client.js";
import type { AppointmentRow, Child, Measurement, Vaccination } from "./queries.js";
import { appointment, child, measurement, vaccination } from "./schema.js";

const isoDate = z.iso.date();
const note = z.string().trim().max(500).nullable();

/** A child's profile, as entered when the family starts. */
export const childInputSchema = z.object({
  familyId: z.uuid(),
  name: z.string().trim().min(1).max(60),
  sex: z.enum(["female", "male"]),
  birthDate: isoDate,
});

export type ChildInput = z.input<typeof childInputSchema>;

/** One measurement; values in grams and millimetres, at least one present. */
export const measurementInputSchema = z
  .object({
    childId: z.uuid(),
    measuredOn: isoDate,
    weightG: z.number().int().positive().max(60_000).nullable(),
    lengthMm: z.number().int().positive().max(1_500).nullable(),
    headMm: z.number().int().positive().max(700).nullable(),
    weightEstimated: z.boolean().default(false),
    lengthEstimated: z.boolean().default(false),
    headEstimated: z.boolean().default(false),
    note: note.default(null),
  })
  .refine((m) => m.weightG !== null || m.lengthMm !== null || m.headMm !== null, {
    message: "At least one of weight, length or head circumference is required",
  });

export type MeasurementInput = z.input<typeof measurementInputSchema>;

const appointmentFields = {
  doseNo: z.number().int().min(1).max(20),
  dueOn: isoDate.nullable(),
  note: note.default(null),
};

/** A dose given, optionally with the clinic's next appointment for the same product. */
export const doseInputSchema = z.object({
  childId: z.uuid(),
  productCode: z.string().min(1),
  doseNo: z.number().int().min(1).max(20),
  givenOn: isoDate,
  place: z.string().trim().max(200).nullable().default(null),
  lot: z.string().trim().max(100).nullable().default(null),
  note: note.default(null),
  nextAppointment: z.object(appointmentFields).nullable().default(null),
});

export type DoseInput = z.input<typeof doseInputSchema>;

export const appointmentInputSchema = z.object({
  childId: z.uuid(),
  productCode: z.string().min(1),
  ...appointmentFields,
});

export type AppointmentInput = z.input<typeof appointmentInputSchema>;

/** The dose (product and number) is already recorded for this child. */
export class DuplicateDoseError extends Error {
  constructor(productCode: string, doseNo: number) {
    super(`Dose ${String(doseNo)} of ${productCode} is already recorded`);
    this.name = "DuplicateDoseError";
  }
}

/** An appointment for this product and dose number already exists. */
export class DuplicateAppointmentError extends Error {
  constructor(productCode: string, doseNo: number) {
    super(`An appointment for dose ${String(doseNo)} of ${productCode} already exists`);
    this.name = "DuplicateAppointmentError";
  }
}

const UNIQUE_VIOLATION = "23505";

/** Postgres error code, from node-postgres/PGlite errors or Drizzle's wrapper around them. */
function pgCode(error: unknown): string | undefined {
  for (let e: unknown = error, depth = 0; e && depth < 3; depth++) {
    if (typeof e === "object" && "code" in e && typeof e.code === "string") return e.code;
    e = typeof e === "object" && "cause" in e ? e.cause : undefined;
  }
  return undefined;
}

export async function addChild(db: Db, input: ChildInput): Promise<Child> {
  const values = childInputSchema.parse(input);
  const [row] = await db.insert(child).values(values).returning();
  if (!row) throw new Error("Child not saved");
  return row;
}

export async function addMeasurement(db: Db, input: MeasurementInput): Promise<Measurement> {
  const values = measurementInputSchema.parse(input);
  const [row] = await db.insert(measurement).values(values).returning();
  if (!row) throw new Error("Measurement not saved");
  return row;
}

/** Updates a child's measurement; returns undefined when it does not exist. */
export async function updateMeasurement(
  db: Db,
  id: string,
  input: MeasurementInput,
): Promise<Measurement | undefined> {
  const values = measurementInputSchema.parse(input);
  const [row] = await db
    .update(measurement)
    .set(values)
    .where(and(eq(measurement.id, id), eq(measurement.childId, values.childId)))
    .returning();
  return row;
}

export async function deleteMeasurement(db: Db, id: string, childId: string): Promise<boolean> {
  const rows = await db
    .delete(measurement)
    .where(and(eq(measurement.id, id), eq(measurement.childId, childId)))
    .returning({ id: measurement.id });
  return rows.length > 0;
}

export async function getMeasurement(
  db: Db,
  id: string,
  childId: string,
): Promise<Measurement | undefined> {
  const [row] = await db
    .select()
    .from(measurement)
    .where(and(eq(measurement.id, id), eq(measurement.childId, childId)));
  return row;
}

/**
 * Records a dose and, when given, the next appointment for the same product.
 * The next appointment replaces an existing one for that dose number (the
 * clinic rebooked it). Both writes happen in one transaction.
 */
export async function recordDose(
  db: Db,
  input: DoseInput,
): Promise<{ dose: Vaccination; nextAppointment: AppointmentRow | undefined }> {
  const values = doseInputSchema.parse(input);
  try {
    return await db.transaction(async (tx) => {
      const { nextAppointment, ...dose } = values;
      const [saved] = await tx.insert(vaccination).values(dose).returning();
      if (!saved) throw new Error("Dose not saved");
      let next: AppointmentRow | undefined;
      if (nextAppointment) {
        [next] = await tx
          .insert(appointment)
          .values({ childId: values.childId, productCode: values.productCode, ...nextAppointment })
          .onConflictDoUpdate({
            target: [appointment.childId, appointment.productCode, appointment.doseNo],
            set: { dueOn: sql`excluded.due_on`, note: sql`excluded.note` },
          })
          .returning();
      }
      return { dose: saved, nextAppointment: next };
    });
  } catch (error) {
    if (pgCode(error) === UNIQUE_VIOLATION)
      throw new DuplicateDoseError(values.productCode, values.doseNo);
    throw error;
  }
}

export async function deleteVaccination(db: Db, id: string, childId: string): Promise<boolean> {
  const rows = await db
    .delete(vaccination)
    .where(and(eq(vaccination.id, id), eq(vaccination.childId, childId)))
    .returning({ id: vaccination.id });
  return rows.length > 0;
}

/** Creates an appointment, or updates `id` when given (the clinic changed the date). */
export async function saveAppointment(
  db: Db,
  input: AppointmentInput,
  id?: string,
): Promise<AppointmentRow | undefined> {
  const values = appointmentInputSchema.parse(input);
  try {
    if (id) {
      const [row] = await db
        .update(appointment)
        .set(values)
        .where(and(eq(appointment.id, id), eq(appointment.childId, values.childId)))
        .returning();
      return row;
    }
    const [row] = await db.insert(appointment).values(values).returning();
    return row;
  } catch (error) {
    if (pgCode(error) === UNIQUE_VIOLATION)
      throw new DuplicateAppointmentError(values.productCode, values.doseNo);
    throw error;
  }
}

export async function deleteAppointment(db: Db, id: string, childId: string): Promise<boolean> {
  const rows = await db
    .delete(appointment)
    .where(and(eq(appointment.id, id), eq(appointment.childId, childId)))
    .returning({ id: appointment.id });
  return rows.length > 0;
}

export async function getAppointment(
  db: Db,
  id: string,
  childId: string,
): Promise<AppointmentRow | undefined> {
  const [row] = await db
    .select()
    .from(appointment)
    .where(and(eq(appointment.id, id), eq(appointment.childId, childId)));
  return row;
}
