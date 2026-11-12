import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import pg from "pg";

import * as schema from "./schema.js";

export type Schema = typeof schema;
export type Db = PgDatabase<PgQueryResultHKT, Schema>;

export interface DbHandle {
  readonly db: Db;
  /** Apply pending migrations from `packages/db/migrations`. */
  readonly migrate: () => Promise<void>;
  readonly close: () => Promise<void>;
}

// Built with path functions rather than `new URL("…", import.meta.url)`, which
// bundlers treat as an asset to inline. Only Node scripts call migrate().
const migrationsFolder = () => join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");
const options = { schema, casing: "snake_case" } as const;

/**
 * Makes a relative `pglite:` folder absolute against `baseDir`, so every
 * process (db scripts, web app) opens the same database whatever its working
 * directory. Other URLs are returned unchanged.
 */
export function resolveDatabaseUrl(url: string, baseDir: string): string {
  if (!url.startsWith("pglite:")) return url;
  const location = url.slice("pglite:".length);
  if (location === "memory" || isAbsolute(location)) return url;
  return `pglite:${resolve(baseDir, location)}`;
}

/**
 * Opens a database from a URL:
 * - `postgres://…` / `postgresql://…`: a PostgreSQL server (node-postgres pool)
 * - `pglite:memory`: an in-memory PGlite database (tests)
 * - `pglite:<path>`: a PGlite database stored in a folder (local runs without Docker)
 */
export function createDb(url: string): DbHandle {
  if (url.startsWith("pglite:")) {
    const location = url.slice("pglite:".length);
    // PGlite creates only the last folder of the path; create the parents too (".data/pglite").
    if (location !== "memory") mkdirSync(location, { recursive: true });
    const client = new PGlite(location === "memory" ? undefined : location);
    const db = drizzlePglite({ client, ...options });
    return {
      db,
      migrate: () => migratePglite(db, { migrationsFolder: migrationsFolder() }),
      close: () => client.close(),
    };
  }
  if (/^postgres(ql)?:\/\//.test(url)) {
    const pool = new pg.Pool({ connectionString: url });
    const db = drizzlePg({ client: pool, ...options });
    return {
      db,
      migrate: () => migratePg(db, { migrationsFolder: migrationsFolder() }),
      close: () => pool.end(),
    };
  }
  throw new Error("DATABASE_URL must start with postgres://, postgresql:// or pglite:");
}
