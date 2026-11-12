import next from "@repo/eslint-config/next";
import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig(next, {
  files: ["scripts/**/*.mjs", "*.config.{js,mjs,ts}"],
  languageOptions: { globals: globals.node },
});
