import "server-only";

import { resolve } from "node:path";

import { createDb, type Db, type DbHandle, resolveDatabaseUrl } from "@notch/db";

// Reuse one connection across hot reloads in development.
const cache = globalThis as unknown as { notchDb?: DbHandle };

/**
 * The database, or undefined when DATABASE_URL is not configured. Next.js
 * runs from apps/web, so relative PGlite folders resolve from two levels up:
 * the repository root, the same base the db scripts use.
 */
export function getDb(): Db | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  cache.notchDb ??= createDb(resolveDatabaseUrl(url, resolve(process.cwd(), "../..")));
  return cache.notchDb.db;
}
