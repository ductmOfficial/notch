import { defineConfig, devices } from "@playwright/test";

import { EMPTY_OUTBOX, EMPTY_PORT, OUTBOX, PARENT, PORT, SIGNED_IN } from "./e2e/constants";

/** A test server: `next start` on a fresh database, signing in only the test parent. */
const server = (port: number, env: Record<string, string>) => ({
  command: `node e2e/prepare-db.mjs && next start -p ${String(port)}`,
  url: `http://localhost:${String(port)}`,
  env: {
    NEXT_TELEMETRY_DISABLED: "1",
    BETTER_AUTH_SECRET: "e2e-only-secret-not-used-anywhere-else",
    BETTER_AUTH_URL: `http://localhost:${String(port)}`,
    NOTCH_ALLOWED_EMAILS: PARENT,
    RESEND_API_KEY: "",
    ...env,
  },
  reuseExistingServer: false,
});

export default defineConfig({
  testDir: "e2e",
  // The tests share one database and some of them change it.
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    // CI uses the Chrome that the runner image ships; locally, Playwright's Chromium.
    ...(process.env.CHROME_PATH && { launchOptions: { executablePath: process.env.CHROME_PATH } }),
  },
  projects: [
    // Signs in once through the real magic-link flow and stores the session.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], storageState: SIGNED_IN },
      dependencies: ["setup"],
      testIgnore: /onboarding\.spec\.ts/,
    },
    // Flows that change data, and sign-in itself, run once, on desktop.
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], storageState: SIGNED_IN },
      dependencies: ["setup"],
      testIgnore: /(flows|auth|onboarding)\.spec\.ts/,
    },
    // First run of a new family, on a second server whose database has no child.
    {
      name: "onboarding",
      testMatch: /onboarding\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: `http://localhost:${String(EMPTY_PORT)}` },
    },
  ],
  webServer: [
    server(PORT, {
      DATABASE_URL: "pglite:apps/web/.e2e-db",
      NOTCH_SEED_FILE: "packages/db/fixtures/demo-child.json",
      MAIL_OUTBOX: OUTBOX,
    }),
    server(EMPTY_PORT, {
      DATABASE_URL: "pglite:apps/web/.e2e-db-empty",
      MAIL_OUTBOX: EMPTY_OUTBOX,
    }),
  ],
});
