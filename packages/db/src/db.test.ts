import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { CATALOG } from "@notch/vaccines";
import { count, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { syncCatalog } from "./catalog.js";
import { createDb, resolveDatabaseUrl } from "./client.js";
import { getChild, listChildren, listMeasurements } from "./queries.js";
import {
  appointment,
  child,
  family,
  measurement,
  productDisease,
  vaccination,
  vaccineProduct,
} from "./schema.js";

const handle = createDb("pglite:memory");
const { db } = handle;
let childId = "";
let familyId = "";

beforeAll(async () => {
  await handle.migrate();
  await syncCatalog(db, CATALOG);
  const [f] = await db.insert(family).values({ name: "Test family" }).returning();
  if (!f) throw new Error("family not created");
  familyId = f.id;
  const [c] = await db
    .insert(child)
    .values({ familyId: f.id, name: "Test", sex: "female", birthDate: "2030-01-01" })
    .returning();
  if (!c) throw new Error("child not created");
  childId = c.id;
});

afterAll(async () => {
  await handle.close();
});

describe("resolveDatabaseUrl", () => {
  it("resolves relative PGlite folders against the base directory", () => {
    expect(resolveDatabaseUrl("pglite:.data/pglite", "/repo")).toBe("pglite:/repo/.data/pglite");
    expect(resolveDatabaseUrl("pglite:./.data/pglite", "/repo")).toBe("pglite:/repo/.data/pglite");
  });

  it("leaves memory, absolute and server URLs alone", () => {
    expect(resolveDatabaseUrl("pglite:memory", "/repo")).toBe("pglite:memory");
    expect(resolveDatabaseUrl("pglite:/data/db", "/repo")).toBe("pglite:/data/db");
    expect(resolveDatabaseUrl("postgres://u:p@h/db", "/repo")).toBe("postgres://u:p@h/db");
  });
});

describe("createDb", () => {
  it("rejects unknown URL schemes", () => {
    expect(() => createDb("mysql://localhost/app")).toThrow("DATABASE_URL");
  });

  it("persists a PGlite database in a folder", async () => {
    const dir = await mkdtemp(join(tmpdir(), "notch-db-"));
    try {
      const first = createDb(`pglite:${dir}`);
      await first.migrate();
      await first.db.insert(family).values({ name: "Saved" });
      await first.close();
      const second = createDb(`pglite:${dir}`);
      const rows = await second.db.select().from(family);
      expect(rows.map((r) => r.name)).toEqual(["Saved"]);
      await second.close();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("uses node-postgres for postgres:// URLs", async () => {
    // Port 1 has no server: creating the pool is lazy, migrating must fail to connect.
    const pgHandle = createDb("postgres://user:pass@127.0.0.1:1/app");
    await expect(pgHandle.migrate()).rejects.toThrow();
    await pgHandle.close();
  });
});

describe("syncCatalog", () => {
  it("writes every product and disease link", async () => {
    const [products] = await db.select({ n: count() }).from(vaccineProduct);
    const [links] = await db.select({ n: count() }).from(productDisease);
    expect(products?.n).toBe(CATALOG.products.length);
    expect(links?.n).toBe(CATALOG.products.reduce((sum, p) => sum + p.diseases.length, 0));
  });

  it("is idempotent and updates names", async () => {
    const renamed = {
      ...CATALOG,
      products: CATALOG.products.map((p) => (p.code === "bcg" ? { ...p, name: "BCG vaccine" } : p)),
    };
    await syncCatalog(db, renamed);
    await syncCatalog(db, renamed);
    const [bcg] = await db.select().from(vaccineProduct).where(eq(vaccineProduct.code, "bcg"));
    expect(bcg?.name).toBe("BCG vaccine");
    const [links] = await db.select({ n: count() }).from(productDisease);
    expect(links?.n).toBe(CATALOG.products.reduce((sum, p) => sum + p.diseases.length, 0));
    await syncCatalog(db, CATALOG);
  });
});

describe("queries", () => {
  it("lists children and finds one by id", async () => {
    expect((await listChildren(db, familyId)).map((c) => c.id)).toEqual([childId]);
    expect(await listChildren(db, "00000000-0000-0000-0000-000000000000")).toEqual([]);
    expect((await getChild(db, childId))?.birthDate).toBe("2030-01-01");
    expect(await getChild(db, "00000000-0000-0000-0000-000000000000")).toBeUndefined();
  });

  it("returns measurements oldest first, with dates as strings", async () => {
    await db.insert(measurement).values([
      { childId, measuredOn: "2030-03-01", weightG: 5200, lengthMm: 575 },
      { childId, measuredOn: "2030-02-01", weightG: 4300, weightEstimated: true },
    ]);
    const rows = await listMeasurements(db, childId);
    expect(rows.map((r) => [r.measuredOn, r.weightG, r.weightEstimated])).toEqual([
      ["2030-02-01", 4300, true],
      ["2030-03-01", 5200, false],
    ]);
  });
});

describe("constraints", () => {
  it("rejects a measurement without any value", async () => {
    await expect(
      db.insert(measurement).values({ childId, measuredOn: "2030-04-01" }),
    ).rejects.toThrow();
  });

  it("rejects non-positive values", async () => {
    await expect(
      db.insert(measurement).values({ childId, measuredOn: "2030-04-01", weightG: 0 }),
    ).rejects.toThrow();
  });

  it("rejects a second record of the same dose", async () => {
    const dose = { childId, productCode: "rotarix", doseNo: 1, givenOn: "2030-03-01" };
    await db.insert(vaccination).values(dose);
    await expect(db.insert(vaccination).values(dose)).rejects.toThrow();
  });

  it("rejects unknown products", async () => {
    await expect(
      db
        .insert(appointment)
        .values({ childId, productCode: "nope", doseNo: 1, dueOn: "2030-05-01" }),
    ).rejects.toThrow();
  });

  it("allows an appointment without a date", async () => {
    const [row] = await db
      .insert(appointment)
      .values({
        childId,
        productCode: "bexsero",
        doseNo: 3,
        dueOn: null,
        note: "after the first birthday",
      })
      .returning();
    expect(row?.dueOn).toBeNull();
  });

  it("deletes a child's records with the child", async () => {
    await db.delete(child).where(eq(child.id, childId));
    const [left] = await db.select({ n: count() }).from(measurement);
    expect(left?.n).toBe(0);
  });
});
