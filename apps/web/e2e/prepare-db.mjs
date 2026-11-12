#!/usr/bin/env node
/**
 * Fresh database for the end-to-end tests: a PGlite folder with the migrations applied and the
 * fictional demo child seeded. Run before the test server starts (see playwright.config.ts).
 */
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";

const env = {
  ...process.env,
  // Relative to the repository root, like every DATABASE_URL in this repo.
  DATABASE_URL: "pglite:apps/web/.e2e-db",
  NOTCH_SEED_FILE: "packages/db/fixtures/demo-child.json",
};
rmSync(new URL("../.e2e-db", import.meta.url), { recursive: true, force: true });
for (const script of ["migrate", "seed"]) {
  execFileSync(process.execPath, [`../../packages/db/dist/cli/${script}.js`], {
    env,
    stdio: "inherit",
  });
}
