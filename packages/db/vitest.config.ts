import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // PGlite boots a WebAssembly Postgres per test file; give it time on cold starts.
    testTimeout: 30_000,
    // Each test file starts its own WebAssembly Postgres (~200 MB); running the
    // files one at a time keeps memory low when Turbo runs every task at once.
    fileParallelism: false,
    hookTimeout: 30_000,
    coverage: {
      include: ["src/**/*.ts"],
      // The schema is declarative; its `references` callbacks only run inside drizzle-kit.
      exclude: ["src/cli/**", "src/schema.ts"],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
});
