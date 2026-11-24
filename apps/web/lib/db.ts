import "server-only";

import { resolve } from "node:path";

import { createDb, type Db, type DbHandle, resolveDatabaseUrl } from "@notch/db";

import { getDemoDb, isDemo } from "./demo";

// Reuse one connection across hot reloads in development.
const cache = globalThis as unknown as { notchDb?: DbHandle };

/**
 * The app's database, or undefined when DATABASE_URL is not configured. Next.js
 * runs from apps/web, so relative PGlite folders resolve from two levels up:
 * the repository root, the same base the db scripts use. Sign-in, server actions and
 * the calendar subscription always use it.
 */
export function getAppDb(): Db | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  cache.notchDb ??= createDb(resolveDatabaseUrl(url, resolve(process.cwd(), "../..")));
  return cache.notchDb.db;
}

/**
 * The database pages read: the in-memory demo for a browser in demo mode (lib/demo.ts),
 * otherwise the app's database.
 */
export async function getDb(): Promise<Db | undefined> {
  return (await isDemo()) ? getDemoDb() : getAppDb();
}
