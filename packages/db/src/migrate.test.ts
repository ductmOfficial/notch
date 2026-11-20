import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { CATALOG } from "@notch/vaccines";
import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, describe, expect, it } from "vitest";

import { syncCatalog } from "./catalog.js";
import { createDb, type DbHandle } from "./client.js";
import { migrateDatabase } from "./migrate.js";
import * as schema from "./schema.js";
import { disease, productDisease, vaccineProduct } from "./schema.js";
import { seedChild } from "./seed.js";

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

// ── Upgrading a database that already holds records ───────────────────────
// Production migrates on every deployment, over the family's real records. This applies every
// migration but the latest, writes records the way the app did then, and checks that the
// latest migration and the catalog sync leave every existing row as it was.

const here = dirname(fileURLToPath(import.meta.url));
const migrations = join(here, "..", "migrations");

interface Journal {
  readonly entries: readonly { readonly tag: string }[];
}

/** A copy of the migrations folder without its latest migration. */
async function previousMigrations(): Promise<{ folder: string; latest: string }> {
  const journal = JSON.parse(
    await readFile(join(migrations, "meta", "_journal.json"), "utf8"),
  ) as Journal;
  const entries = journal.entries.slice(0, -1);
  const folder = await mkdtemp(join(tmpdir(), "notch-migrations-"));
  await mkdir(join(folder, "meta"));
  for (const { tag } of entries)
    await cp(join(migrations, `${tag}.sql`), join(folder, `${tag}.sql`));
  await writeFile(join(folder, "meta", "_journal.json"), JSON.stringify({ ...journal, entries }));
  return { folder, latest: journal.entries.at(-1)?.tag ?? "" };
}

type Rows = Record<string, Record<string, unknown>[]>;

/** Every row of every table in the public schema, as JSON. */
async function snapshot(client: PGlite): Promise<Rows> {
  const tables = await client.query<{ name: string }>(
    "select table_name as name from information_schema.tables " +
      "where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name",
  );
  const rows: Rows = {};
  for (const { name } of tables.rows) {
    const result = await client.query<{ row: Record<string, unknown> }>(
      `select to_jsonb(t) as row from "${name}" t`,
    );
    rows[name] = result.rows.map((r) => r.row);
  }
  return rows;
}

describe("migrating a database with records", () => {
  const client = new PGlite();
  const db = drizzle({ client, schema, casing: "snake_case" });
  let previous = "";

  afterAll(async () => {
    await client.close();
    if (previous) await rm(previous, { recursive: true, force: true });
  });

  it("keeps every existing row when the latest migration is applied", async () => {
    const { folder, latest } = await previousMigrations();
    previous = folder;
    expect(latest).not.toBe("");
    await migrate(db, { migrationsFolder: folder });
    await syncCatalog(db, CATALOG);

    // Records as the app wrote them before: the demo child, a parent signed in, a calendar link.
    const demo: unknown = JSON.parse(
      await readFile(join(here, "..", "fixtures", "demo-child.json"), "utf8"),
    );
    await seedChild(db, CATALOG, demo);
    await client.exec(`
      insert into "user" (id, name, email, email_verified) values ('u1', 'Parent', 'parent@example.com', true);
      insert into session (id, user_id, token, expires_at) values ('s1', 'u1', 't1', now() + interval '1 day');
      insert into family_member (family_id, user_id) select id, 'u1' from family;
      insert into calendar_token (family_id, token_hash) select id, 'hash' from family;
    `);
    const before = await snapshot(client);
    expect(before.measurement?.length).toBeGreaterThan(0);
    expect(before.vaccination?.length).toBeGreaterThan(0);

    // What a deployment runs.
    const handle: DbHandle = {
      db,
      migrate: () => migrate(db, { migrationsFolder: migrations }),
      close: () => Promise.resolve(),
    };
    await migrateDatabase(handle, CATALOG);
    const after = await snapshot(client);

    for (const [table, rows] of Object.entries(before)) {
      expect(after[table], table).toHaveLength(rows.length);
      // A new column may appear on old rows; every value that was there stays.
      expect(after[table], table).toEqual(
        expect.arrayContaining(rows.map((row): unknown => expect.objectContaining(row))),
      );
    }
    const added = Object.keys(after).filter((table) => !(table in before));
    for (const table of added) expect(after[table], table).toEqual([]);

    // Running it again changes nothing.
    await migrateDatabase(handle, CATALOG);
    expect(await snapshot(client)).toEqual(after);
  });
});
