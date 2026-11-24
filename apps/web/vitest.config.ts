import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig keeps JSX for Next.js; the PDF test renders React components, so compile it here.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: { "server-only": fileURLToPath(new URL("./test/server-only.ts", import.meta.url)) },
  },
  test: {
    include: ["lib/**/*.test.ts", "lib/**/*.test.tsx"],
    coverage: {
      include: ["lib/**/*.ts"],
      exclude: ["lib/db.ts", "lib/child.ts"],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
});
