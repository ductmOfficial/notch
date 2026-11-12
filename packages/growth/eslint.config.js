import base from "@repo/eslint-config/base";
import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig(base, {
  files: ["scripts/**/*.mjs"],
  languageOptions: { globals: globals.node },
});
