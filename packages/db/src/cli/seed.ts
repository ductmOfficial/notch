import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { CATALOG } from "@notch/vaccines";

import { syncCatalog } from "../catalog.js";
import { createDb } from "../client.js";
import { SeedConflictError, seedChild } from "../seed.js";
import { databaseUrl, repoRoot, requireEnv } from "./env.js";

// The seed file holds real health data and lives outside the repository;
// relative paths are resolved from the repository root.
const url = databaseUrl();
const file = resolve(
  repoRoot,
  requireEnv("NOTCH_SEED_FILE", "Point it at a JSON file outside the repository."),
);

const handle = createDb(url);
try {
  await handle.migrate();
  await syncCatalog(handle.db, CATALOG);
  const replace = process.argv.includes("--replace");
  const result = await seedChild(handle.db, CATALOG, JSON.parse(await readFile(file, "utf8")), {
    replace,
  });
  console.log(
    `${result.created ? "Created" : "Updated"} child ${result.childId}: ` +
      `${String(result.measurements)} measurements, ${String(result.vaccinations)} vaccinations, ` +
      `${String(result.appointments)} appointments.`,
  );
} catch (error) {
  if (!(error instanceof SeedConflictError)) throw error;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await handle.close();
}
