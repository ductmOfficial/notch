#!/usr/bin/env node
/**
 * Fresh state for an end-to-end test server, from the server's environment (see
 * playwright.config.ts): an empty PGlite folder at DATABASE_URL with the migrations applied,
 * the child in NOTCH_SEED_FILE seeded when set, and an empty sign-in outbox at MAIL_OUTBOX.
 */
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";

const { DATABASE_URL = "", MAIL_OUTBOX, NOTCH_SEED_FILE } = process.env;
// Relative to the repository root, like every DATABASE_URL in this repo.
const folder = DATABASE_URL.replace(/^pglite:/, "../../");
if (!DATABASE_URL.startsWith("pglite:apps/web/.e2e"))
  throw new Error(`Not a test database: ${DATABASE_URL}`);

rmSync(folder, { recursive: true, force: true });
if (MAIL_OUTBOX) rmSync(MAIL_OUTBOX, { force: true });
for (const script of NOTCH_SEED_FILE ? ["migrate", "seed"] : ["migrate"]) {
  execFileSync(process.execPath, [`../../packages/db/dist/cli/${script}.js`], {
    stdio: "inherit",
  });
}
