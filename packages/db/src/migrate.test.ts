import { CATALOG } from "@notch/vaccines";
import { count } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { createDb } from "./client.js";
import { migrateDatabase } from "./migrate.js";
import { disease, productDisease, vaccineProduct } from "./schema.js";

const handle = createDb("pglite:memory");
const { db } = handle;

afterAll(async () => {
  await handle.close();
});

const rowCount = async (table: typeof disease | typeof vaccineProduct | typeof productDisease) =>
  (await db.select({ n: count() }).from(table))[0]?.n;

const links = CATALOG.products.reduce((n, p) => n + p.diseases.length, 0);

describe("migrateDatabase", () => {
  it("applies the migrations and loads every vaccine of the catalog", async () => {
    const result = await migrateDatabase(handle, CATALOG);
    expect(result).toEqual({
      diseases: CATALOG.diseases.length,
      products: CATALOG.products.length,
    });

    const codes = await db.select({ code: vaccineProduct.code }).from(vaccineProduct);
    expect(codes.map((r) => r.code).sort()).toEqual(CATALOG.products.map((p) => p.code).sort());
    expect(codes.map((r) => r.code)).toContain("bcg");
    expect(await rowCount(disease)).toBe(CATALOG.diseases.length);
    expect(await rowCount(productDisease)).toBe(links);
  });

  it("runs again without errors or duplicate rows", async () => {
    await expect(migrateDatabase(handle, CATALOG)).resolves.toBeDefined();
    expect(await rowCount(vaccineProduct)).toBe(CATALOG.products.length);
    expect(await rowCount(disease)).toBe(CATALOG.diseases.length);
    expect(await rowCount(productDisease)).toBe(links);
  });
});
