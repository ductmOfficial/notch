import { fileURLToPath } from "node:url";

import { resolveDatabaseUrl } from "../client.js";

/** The repository root (this file is packages/db/dist/cli/env.js). */
export const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));

/** Reads a required environment variable or exits with a helpful message. */
export function requireEnv(name: string, hint: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} is not set. ${hint}`);
    process.exit(1);
  }
  return value;
}

/** DATABASE_URL, with relative PGlite folders resolved from the repository root. */
export function databaseUrl(): string {
  return resolveDatabaseUrl(
    requireEnv("DATABASE_URL", "Copy .env.example to .env, or pass it inline."),
    repoRoot,
  );
}
