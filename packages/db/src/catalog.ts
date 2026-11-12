import type { Catalog } from "@notch/vaccines";
import { sql } from "drizzle-orm";

import type { Db } from "./client.js";
import { disease, productDisease, vaccineProduct } from "./schema.js";

/**
 * Writes the vaccine catalog (diseases, products and which product covers
 * which disease) to the database. Safe to run repeatedly: rows are upserted
 * and a product's disease links are replaced.
 */
export async function syncCatalog(db: Db, catalog: Catalog): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .insert(disease)
      .values(catalog.diseases.map((d) => ({ code: d.code, nameVi: d.name.vi, nameEn: d.name.en })))
      .onConflictDoUpdate({
        target: disease.code,
        set: { nameVi: sql`excluded.name_vi`, nameEn: sql`excluded.name_en` },
      });
    await tx
      .insert(vaccineProduct)
      .values(catalog.products.map((p) => ({ code: p.code, name: p.name })))
      .onConflictDoUpdate({ target: vaccineProduct.code, set: { name: sql`excluded.name` } });
    await tx.delete(productDisease);
    await tx
      .insert(productDisease)
      .values(
        catalog.products.flatMap((p) =>
          p.diseases.map((d) => ({ productCode: p.code, diseaseCode: d })),
        ),
      );
  });
}
