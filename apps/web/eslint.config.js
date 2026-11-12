import next from "@repo/eslint-config/next";
import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig(next, {
  files: ["scripts/**/*.mjs", "e2e/**/*.mjs", "*.config.{js,mjs,ts}"],
  languageOptions: { globals: globals.node },
});
