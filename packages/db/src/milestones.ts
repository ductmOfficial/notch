import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { Db } from "./client.js";
import { milestone } from "./schema.js";

export type Milestone = typeof milestone.$inferSelect;

export const MILESTONE_KINDS = ["motor", "language", "teeth", "social", "other"] as const;
export type MilestoneKind = (typeof MILESTONE_KINDS)[number];

/** A milestone as entered: what happened and when, in the family's words. */
export const milestoneInputSchema = z.object({
  childId: z.uuid(),
  kind: z.enum(MILESTONE_KINDS),
  title: z.string().trim().min(1).max(120),
  happenedOn: z.iso.date(),
  note: z.string().trim().max(500).nullable().default(null),
});

export type MilestoneInput = z.input<typeof milestoneInputSchema>;

/** A child's milestones, the most recent first. */
export async function listMilestones(db: Db, childId: string): Promise<Milestone[]> {
  return db
    .select()
    .from(milestone)
    .where(eq(milestone.childId, childId))
    .orderBy(desc(milestone.happenedOn), desc(milestone.createdAt));
}

export async function getMilestone(
  db: Db,
  id: string,
  childId: string,
): Promise<Milestone | undefined> {
  const [row] = await db
    .select()
    .from(milestone)
    .where(and(eq(milestone.id, id), eq(milestone.childId, childId)));
  return row;
}

export async function addMilestone(db: Db, input: MilestoneInput): Promise<Milestone> {
  const values = milestoneInputSchema.parse(input);
  const [row] = await db.insert(milestone).values(values).returning();
  if (!row) throw new Error("Milestone not saved");
  return row;
}

/** Updates a child's milestone; returns undefined when it does not exist. */
export async function updateMilestone(
  db: Db,
  id: string,
  input: MilestoneInput,
): Promise<Milestone | undefined> {
  const values = milestoneInputSchema.parse(input);
  const [row] = await db
    .update(milestone)
    .set(values)
    .where(and(eq(milestone.id, id), eq(milestone.childId, values.childId)))
    .returning();
  return row;
}

export async function deleteMilestone(db: Db, id: string, childId: string): Promise<boolean> {
  const rows = await db
    .delete(milestone)
    .where(and(eq(milestone.id, id), eq(milestone.childId, childId)))
    .returning({ id: milestone.id });
  return rows.length > 0;
}
