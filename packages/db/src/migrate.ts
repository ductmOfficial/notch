import type { Catalog } from "@notch/vaccines";

import { syncCatalog } from "./catalog.js";
import type { DbHandle } from "./client.js";

export interface MigrateResult {
  readonly diseases: number;
  readonly products: number;
}

/**
 * Applies pending migrations, then writes the vaccine catalog. Deployments
 * only migrate, so the catalog has to be loaded here too. Safe to run again.
 */
export async function migrateDatabase(handle: DbHandle, catalog: Catalog): Promise<MigrateResult> {
  await handle.migrate();
  await syncCatalog(handle.db, catalog);
  return { diseases: catalog.diseases.length, products: catalog.products.length };
}
