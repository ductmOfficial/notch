import "server-only";

import { resolve } from "node:path";

import {
  addHealthEntry,
  addMilestone,
  addTemperature,
  type Child,
  createDb,
  type Db,
  type DbHandle,
  getChild,
  listChildren,
  migrateDatabase,
  seedChild,
} from "@notch/db";
import { CATALOG } from "@notch/vaccines";
import { cookies } from "next/headers";

import demoChild from "../../../packages/db/fixtures/demo-child.json";

import { DEMO_COOKIE } from "./demo-cookie";

export { DEMO_COOKIE };

export async function isDemo(): Promise<boolean> {
  return (await cookies()).get(DEMO_COOKIE)?.value === "1";
}

interface Demo {
  readonly handle: DbHandle;
  readonly familyId: string;
}

const cache = globalThis as unknown as { notchDemo?: Promise<Demo> };

const dayBefore = (date: string, days: number): string =>
  new Date(Date.parse(`${date}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);

/**
 * The demo database: in memory, one per server instance, with Mây, the fictional child of
 * `packages/db/fixtures/demo-child.json`, a few milestones and a short illness. Nothing in
 * it is anyone's record, and nothing written to it outlives the instance; the demo is
 * read-only anyway (its viewer has the viewer role).
 */
async function buildDemo(): Promise<Demo> {
  const handle = createDb("pglite:memory", {
    // The web app runs from apps/web; the migrations ship with it (next.config.ts).
    migrationsFolder: resolve(process.cwd(), "../../packages/db/migrations"),
  });
  await migrateDatabase(handle, CATALOG);
  const { childId } = await seedChild(handle.db, CATALOG, demoChild);
  const born = demoChild.child.birthDate;
  const lastDose = demoChild.vaccinations.at(-1)?.date ?? born;
  const milestones = [
    { kind: "social", title: "Nụ cười đầu tiên", happenedOn: "2025-06-28" },
    { kind: "motor", title: "Tự lật", happenedOn: "2025-09-02" },
    { kind: "teeth", title: "Chiếc răng đầu tiên", happenedOn: "2025-12-10" },
    { kind: "language", title: "Gọi “mẹ”", happenedOn: "2026-03-05" },
    { kind: "motor", title: "Những bước đi đầu tiên", happenedOn: "2026-05-18" },
  ] as const;
  for (const m of milestones) await addMilestone(handle.db, { childId, ...m });
  const illness = await addHealthEntry(handle.db, {
    childId,
    kind: "illness",
    title: "Sốt nhẹ sau tiêm",
    startedOn: lastDose,
    endedOn: dayBefore(lastDose, -1),
  });
  await addHealthEntry(handle.db, {
    childId,
    kind: "visit",
    title: "Khám tai mũi họng",
    startedOn: dayBefore(lastDose, 40),
    endedOn: dayBefore(lastDose, 40),
    note: "Viêm họng nhẹ, theo dõi ở nhà",
  });
  for (const [at, tenthsC] of [
    [`${lastDose}T20:00:00+07:00`, 381],
    [`${dayBefore(lastDose, -1)}T07:30:00+07:00`, 374],
  ] as const) {
    await addTemperature(handle.db, {
      childId,
      measuredAt: at,
      tenthsC,
      healthEntryId: illness.id,
    });
  }
  const seeded = await getChild(handle.db, childId);
  if (!seeded) throw new Error("The demo child was not seeded");
  return { handle, familyId: seeded.familyId };
}

function demo(): Promise<Demo> {
  cache.notchDemo ??= buildDemo().catch((error: unknown) => {
    // A failed build is not cached: the next request tries again.
    cache.notchDemo = undefined;
    throw error;
  });
  return cache.notchDemo;
}

/** The demo database, built on first use in this server instance. */
export async function getDemoDb(): Promise<Db> {
  return (await demo()).handle.db;
}

/** The demo's family and its children, for the demo viewer. */
export async function demoFamily(): Promise<{ familyId: string; children: Child[] }> {
  const { handle, familyId } = await demo();
  return { familyId, children: await listChildren(handle.db, familyId) };
}
