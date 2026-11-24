import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { createDb } from "./client.js";
import {
  addMilestone,
  deleteMilestone,
  getMilestone,
  listMilestones,
  updateMilestone,
} from "./milestones.js";
import { addChild } from "./mutations.js";
import { child, family } from "./schema.js";

const handle = createDb("pglite:memory");
const { db } = handle;
let childId = "";
let otherId = "";

beforeAll(async () => {
  await handle.migrate();
  const [f] = await db.insert(family).values({ name: "Test" }).returning();
  const familyId = f?.id ?? "";
  childId = (await addChild(db, { familyId, name: "Mây", sex: "female", birthDate: "2030-01-01" }))
    .id;
  otherId = (await addChild(db, { familyId, name: "Bin", sex: "male", birthDate: "2031-01-01" }))
    .id;
});

afterAll(async () => {
  await handle.close();
});

describe("milestones", () => {
  it("adds and lists a child's milestones, the most recent first", async () => {
    const tooth = await addMilestone(db, {
      childId,
      kind: "teeth",
      title: " First tooth ",
      happenedOn: "2030-07-01",
    });
    expect(tooth).toMatchObject({ title: "First tooth", note: null });
    await addMilestone(db, {
      childId,
      kind: "motor",
      title: "Rolled over",
      happenedOn: "2030-04-10",
    });
    await addMilestone(db, {
      childId: otherId,
      kind: "language",
      title: "Mama",
      happenedOn: "2031-09-01",
    });
    expect((await listMilestones(db, childId)).map((m) => m.title)).toEqual([
      "First tooth",
      "Rolled over",
    ]);
    expect(await getMilestone(db, tooth.id, otherId)).toBeUndefined();
  });

  it("refuses unknown kinds, empty titles and bad dates", async () => {
    for (const input of [
      { childId, kind: "sport", title: "x", happenedOn: "2030-01-02" },
      { childId, kind: "motor", title: "  ", happenedOn: "2030-01-02" },
      { childId, kind: "motor", title: "x", happenedOn: "2030-02-30" },
    ]) {
      await expect(addMilestone(db, input as never)).rejects.toBeInstanceOf(ZodError);
    }
  });

  it("updates and deletes only the child's own, and goes with the child", async () => {
    const m = await addMilestone(db, {
      childId: otherId,
      kind: "social",
      title: "Waved",
      happenedOn: "2031-10-01",
    });
    const input = {
      childId: otherId,
      kind: "social",
      title: "Waved bye",
      happenedOn: "2031-10-02",
    } as const;
    expect(await updateMilestone(db, m.id, { ...input, childId })).toBeUndefined();
    expect(await updateMilestone(db, m.id, input)).toMatchObject({ title: "Waved bye" });
    expect(await deleteMilestone(db, m.id, childId)).toBe(false);
    await db.delete(child).where(eq(child.id, otherId));
    expect(await listMilestones(db, otherId)).toEqual([]);
  });
});
