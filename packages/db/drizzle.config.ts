import { defineConfig } from "drizzle-kit";

// Only `drizzle-kit generate` reads this; it diffs the schema against the
// migration snapshots and needs no database connection.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./migrations",
  casing: "snake_case",
});
