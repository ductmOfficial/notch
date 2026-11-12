import { defineConfig, devices } from "@playwright/test";

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
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Flows that change data run once, on desktop.
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: /flows\.spec\.ts/ },
  ],
  webServer: {
    command: `node e2e/prepare-db.mjs && next start -p ${String(port)}`,
    url: `http://localhost:${String(port)}`,
    env: { DATABASE_URL: "pglite:apps/web/.e2e-db", NEXT_TELEMETRY_DISABLED: "1" },
    reuseExistingServer: false,
  },
});
