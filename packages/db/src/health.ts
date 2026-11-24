import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { Db } from "./client.js";
import { healthEntry, temperature } from "./schema.js";

export type HealthEntry = typeof healthEntry.$inferSelect;
export type Temperature = typeof temperature.$inferSelect;

const isoDate = z.iso.date();
const note = z.string().trim().max(500).nullable();

/** Lowest and highest readings accepted, in tenths of a degree Celsius (34.0 to 43.0 °C). */
export const TEMPERATURE_RANGE = { min: 340, max: 430 } as const;

/** An illness, a course of medicine or a doctor's visit. */
export const healthEntryInputSchema = z
  .object({
    childId: z.uuid(),
    kind: z.enum(["illness", "medication", "visit"]),
    title: z.string().trim().min(1).max(120),
    startedOn: isoDate,
    endedOn: isoDate.nullable().default(null),
    note: note.default(null),
  })
  // ISO dates compare as strings.
  .refine((e) => e.endedOn === null || e.endedOn >= e.startedOn, {
    message: "The end date cannot be before the start date",
    path: ["endedOn"],
  });

export type HealthEntryInput = z.input<typeof healthEntryInputSchema>;

/** One temperature reading, optionally attached to one of the child's health entries. */
export const temperatureInputSchema = z.object({
  childId: z.uuid(),
  measuredAt: z.iso.datetime({ offset: true }).transform((s) => new Date(s)),
  tenthsC: z.number().int().min(TEMPERATURE_RANGE.min).max(TEMPERATURE_RANGE.max),
  healthEntryId: z.uuid().nullable().default(null),
  note: note.default(null),
});

export type TemperatureInput = z.input<typeof temperatureInputSchema>;

/** The health entry does not exist, or belongs to another child. */
export class UnknownHealthEntryError extends Error {
  constructor() {
    super("The health entry does not belong to this child");
    this.name = "UnknownHealthEntryError";
  }
}

// ── Health entries ───────────────────────────────────────────────────────

/** A child's health entries, the most recent first. */
export async function listHealthEntries(db: Db, childId: string): Promise<HealthEntry[]> {
  return db
    .select()
    .from(healthEntry)
    .where(eq(healthEntry.childId, childId))
    .orderBy(desc(healthEntry.startedOn), desc(healthEntry.createdAt));
}

export async function getHealthEntry(
  db: Db,
  id: string,
  childId: string,
): Promise<HealthEntry | undefined> {
  const [row] = await db
    .select()
    .from(healthEntry)
    .where(and(eq(healthEntry.id, id), eq(healthEntry.childId, childId)));
  return row;
}

export async function addHealthEntry(db: Db, input: HealthEntryInput): Promise<HealthEntry> {
  const values = healthEntryInputSchema.parse(input);
  const [row] = await db.insert(healthEntry).values(values).returning();
  /* v8 ignore next -- @preserve: a write that returns no row */
  if (!row) throw new Error("Health entry not saved");
  return row;
}

/** Updates a child's health entry; returns undefined when it does not exist. */
export async function updateHealthEntry(
  db: Db,
  id: string,
  input: HealthEntryInput,
): Promise<HealthEntry | undefined> {
  const values = healthEntryInputSchema.parse(input);
  const [row] = await db
    .update(healthEntry)
    .set(values)
    .where(and(eq(healthEntry.id, id), eq(healthEntry.childId, values.childId)))
    .returning();
  return row;
}

/** Deletes a health entry. Its temperature readings are kept, no longer attached to it. */
export async function deleteHealthEntry(db: Db, id: string, childId: string): Promise<boolean> {
  const rows = await db
    .delete(healthEntry)
    .where(and(eq(healthEntry.id, id), eq(healthEntry.childId, childId)))
    .returning({ id: healthEntry.id });
  return rows.length > 0;
}

// ── Temperatures ─────────────────────────────────────────────────────────

/** A child's temperature readings, oldest first; only those of one health entry when given. */
export async function listTemperatures(
  db: Db,
  childId: string,
  healthEntryId?: string,
): Promise<Temperature[]> {
  return db
    .select()
    .from(temperature)
    .where(
      healthEntryId === undefined
        ? eq(temperature.childId, childId)
        : and(eq(temperature.childId, childId), eq(temperature.healthEntryId, healthEntryId)),
    )
    .orderBy(asc(temperature.measuredAt), asc(temperature.createdAt));
}

export async function getTemperature(
  db: Db,
  id: string,
  childId: string,
): Promise<Temperature | undefined> {
  const [row] = await db
    .select()
    .from(temperature)
    .where(and(eq(temperature.id, id), eq(temperature.childId, childId)));
  return row;
}

type TemperatureValues = z.output<typeof temperatureInputSchema>;

/** Fails unless the reading's health entry, when given, belongs to the same child. */
async function checkHealthEntry(db: Db, values: TemperatureValues): Promise<void> {
  if (values.healthEntryId === null) return;
  if (!(await getHealthEntry(db, values.healthEntryId, values.childId))) {
    throw new UnknownHealthEntryError();
  }
}

export async function addTemperature(db: Db, input: TemperatureInput): Promise<Temperature> {
  const values = temperatureInputSchema.parse(input);
  return db.transaction(async (tx) => {
    await checkHealthEntry(tx, values);
    const [row] = await tx.insert(temperature).values(values).returning();
    /* v8 ignore next -- @preserve: a write that returns no row */
    if (!row) throw new Error("Temperature not saved");
    return row;
  });
}

/** Updates a child's temperature reading; returns undefined when it does not exist. */
export async function updateTemperature(
  db: Db,
  id: string,
  input: TemperatureInput,
): Promise<Temperature | undefined> {
  const values = temperatureInputSchema.parse(input);
  return db.transaction(async (tx) => {
    await checkHealthEntry(tx, values);
    const [row] = await tx
      .update(temperature)
      .set(values)
      .where(and(eq(temperature.id, id), eq(temperature.childId, values.childId)))
      .returning();
    return row;
  });
}

export async function deleteTemperature(db: Db, id: string, childId: string): Promise<boolean> {
  const rows = await db
    .delete(temperature)
    .where(and(eq(temperature.id, id), eq(temperature.childId, childId)))
    .returning({ id: temperature.id });
  return rows.length > 0;
}
