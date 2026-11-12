import { createDb } from "../client.js";
import { databaseUrl } from "./env.js";

const handle = createDb(databaseUrl());
try {
  await handle.migrate();
  console.log("Migrations applied.");
} finally {
  await handle.close();
}
