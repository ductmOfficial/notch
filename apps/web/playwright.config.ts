import { defineConfig, devices } from "@playwright/test";

import { OUTBOX, PARENT, SIGNED_IN } from "./e2e/constants";

const port = 3200;

export default defineConfig({
  testDir: "e2e",
  // The tests share one database and some of them change it.
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${String(port)}`,
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
    },
    // Flows that change data, and sign-in itself, run once, on desktop.
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], storageState: SIGNED_IN },
      dependencies: ["setup"],
      testIgnore: /(flows|auth)\.spec\.ts/,
    },
  ],
  webServer: {
    command: `node e2e/prepare-db.mjs && next start -p ${String(port)}`,
    url: `http://localhost:${String(port)}`,
    env: {
      DATABASE_URL: "pglite:apps/web/.e2e-db",
      NEXT_TELEMETRY_DISABLED: "1",
      BETTER_AUTH_SECRET: "e2e-only-secret-not-used-anywhere-else",
      BETTER_AUTH_URL: `http://localhost:${String(port)}`,
      NOTCH_ALLOWED_EMAILS: PARENT,
      MAIL_OUTBOX: OUTBOX,
      RESEND_API_KEY: "",
    },
    reuseExistingServer: false,
  },
});
