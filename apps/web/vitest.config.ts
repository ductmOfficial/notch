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
      // Code that needs a Next.js request (cookies, headers, the session) or a browser; the
      // end-to-end tests cover it.
      exclude: [
        "lib/db.ts",
        "lib/child.ts",
        "lib/auth.ts",
        "lib/auth-client.ts",
        "lib/session.ts",
        "lib/preferences.ts",
        "lib/i18n/server.ts",
        "lib/use-hydrated.ts",
        "lib/demo-cookie.ts",
      ],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
});
