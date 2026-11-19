import { CATALOG } from "@notch/vaccines";

import { createDb } from "../client.js";
import { migrateDatabase } from "../migrate.js";
import { databaseUrl } from "./env.js";

const handle = createDb(databaseUrl());
try {
  const result = await migrateDatabase(handle, CATALOG);
  console.log("Migrations applied.");
  console.log(
    `Vaccine catalog synced: ${String(result.diseases)} diseases, ` +
      `${String(result.products)} vaccines.`,
  );
} finally {
  await handle.close();
}
