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

import { createDb, type DbHandle } from "./client.js";
import { migrateDatabase } from "./migrate.js";
import * as schema from "./schema.js";
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

    // Records as the app wrote them before, in plain SQL: code written against the current
    // schema would name columns the older database does not have yet.
    await client.exec(`
      insert into disease (code, name_vi, name_en) values ('tuberculosis', 'Lao', 'Tuberculosis');
      insert into vaccine_product (code, name) values ('bcg', 'BCG');
      insert into product_disease (product_code, disease_code) values ('bcg', 'tuberculosis');
      insert into family (id, name) values ('00000000-0000-4000-8000-000000000001', 'Gia đình');
      insert into child (id, family_id, name, sex, birth_date, birth_time) values
        ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001',
         'Mây', 'female', '2025-05-20', '08:40');
      insert into measurement (child_id, measured_on, weight_g, length_mm, head_mm, note) values
        ('00000000-0000-4000-8000-000000000002', '2025-05-20', 3150, 490, 338, null),
        ('00000000-0000-4000-8000-000000000002', '2025-06-20', 4200, 535, null, 'clinic');
      insert into vaccination (child_id, product_code, dose_no, given_on, place) values
        ('00000000-0000-4000-8000-000000000002', 'bcg', 1, '2025-05-21', 'Phòng tiêm');
      insert into appointment (child_id, product_code, dose_no, due_on) values
        ('00000000-0000-4000-8000-000000000002', 'bcg', 2, null);
      insert into "user" (id, name, email, email_verified) values ('u1', 'Parent', 'parent@example.com', true);
      insert into session (id, user_id, token, expires_at) values ('s1', 'u1', 't1', now() + interval '1 day');
      insert into family_member (family_id, user_id) select id, 'u1' from family;
      insert into calendar_token (family_id, token_hash) select id, 'hash' from family;
    `);
    // The health log exists from migration 0003 on.
    const hasHealthLog = await client.query(
      "select 1 from information_schema.tables where table_name = 'health_entry'",
    );
    if (hasHealthLog.rows.length > 0) {
      await client.exec(`
        insert into health_entry (id, child_id, kind, title, started_on) values
          ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002',
           'illness', 'Fever', '2025-07-01');
        insert into temperature (child_id, measured_at, tenths_c, health_entry_id) values
          ('00000000-0000-4000-8000-000000000002', '2025-07-01T20:00:00+07:00', 385,
           '00000000-0000-4000-8000-000000000003');
      `);
    }
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

    // The catalog sync adds the products and diseases these few rows lacked; other tables keep
    // exactly their rows.
    const catalog = new Set(["disease", "vaccine_product", "product_disease"]);
    for (const [table, rows] of Object.entries(before)) {
      if (!catalog.has(table)) expect(after[table], table).toHaveLength(rows.length);
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
