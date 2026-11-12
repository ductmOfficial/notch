import { asc, eq, sql } from "drizzle-orm";

import type { Db } from "./client.js";
import { appointment, child, measurement, vaccination } from "./schema.js";

export type Child = typeof child.$inferSelect;
export type Measurement = typeof measurement.$inferSelect;
export type Vaccination = typeof vaccination.$inferSelect;
export type AppointmentRow = typeof appointment.$inferSelect;

/** A family's children, oldest first. */
export async function listChildren(db: Db, familyId: string): Promise<Child[]> {
  return db
    .select()
    .from(child)
    .where(eq(child.familyId, familyId))
    .orderBy(asc(child.birthDate), asc(child.createdAt));
}

export async function getChild(db: Db, id: string): Promise<Child | undefined> {
  const [row] = await db.select().from(child).where(eq(child.id, id));
  return row;
}

/** A child's measurements, oldest first. */
export async function listMeasurements(db: Db, childId: string): Promise<Measurement[]> {
  return db
    .select()
    .from(measurement)
    .where(eq(measurement.childId, childId))
    .orderBy(asc(measurement.measuredOn), asc(measurement.createdAt));
}

/** Doses a child has received, oldest first. */
export async function listVaccinations(db: Db, childId: string): Promise<Vaccination[]> {
  return db
    .select()
    .from(vaccination)
    .where(eq(vaccination.childId, childId))
    .orderBy(asc(vaccination.givenOn), asc(vaccination.productCode), asc(vaccination.doseNo));
}

/** A child's appointments, dated ones first by date, then undated ones. */
export async function listAppointments(db: Db, childId: string): Promise<AppointmentRow[]> {
  return db
    .select()
    .from(appointment)
    .where(eq(appointment.childId, childId))
    .orderBy(
      sql`${appointment.dueOn} asc nulls last`,
      asc(appointment.productCode),
      asc(appointment.doseNo),
    );
}
