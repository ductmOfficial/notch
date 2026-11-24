import { listHealthEntries, listMilestones, listTemperatures } from "@notch/db";
import { describe, expect, it } from "vitest";

import { demoFamily, getDemoDb } from "./demo";

describe("the demo database", () => {
  it("holds the fictional child, milestones and a short illness, built once", async () => {
    const { familyId, children } = await demoFamily();
    expect(familyId).toMatch(/^[0-9a-f-]{36}$/);
    expect(children.map((c) => c.name)).toEqual(["Mây"]);
    const db = await getDemoDb();
    expect(await getDemoDb()).toBe(db);
    const childId = children[0]?.id ?? "";
    expect(await listMilestones(db, childId)).toHaveLength(5);
    const entries = await listHealthEntries(db, childId);
    expect(entries.map((e) => e.kind).sort()).toEqual(["illness", "visit"]);
    expect((await listTemperatures(db, childId)).map((r) => r.tenthsC)).toEqual([381, 374]);
  }, 30_000);
});
