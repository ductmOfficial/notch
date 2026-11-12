# @notch/db

PostgreSQL schema, migrations and queries with [Drizzle](https://orm.drizzle.team). The same code runs against a PostgreSQL server or [PGlite](https://pglite.dev) (PostgreSQL compiled to WebAssembly), which the tests use and which lets you run the app without Docker.

| `DATABASE_URL`        | Database                                                                 |
| --------------------- | ------------------------------------------------------------------------ |
| `postgresql://…`      | PostgreSQL server (`pnpm db:up`)                                         |
| `pglite:.data/pglite` | PGlite stored in a folder (git-ignored), relative to the repository root |
| `pglite:memory`       | In-memory PGlite (tests)                                                 |

## Tables

`family` → `child` → `measurement`, `vaccination`, `appointment`; and the vaccine catalog: `disease`, `vaccine_product`, `product_disease`.

- Measurements are integers (grams, millimetres), with an `estimated` flag for values written as approximate.
- Doses are recorded per product (`vaccination`, unique per child, product and dose number); `product_disease` maps them to diseases.
- `appointment.due_on` is nullable for bookings like "after the first birthday".

## Scripts

Run from the repository root; both read `.env` at the root if present.

```bash
pnpm --filter @notch/db build
pnpm --filter @notch/db migrate   # apply migrations
pnpm --filter @notch/db seed      # migrate, sync the catalog, load NOTCH_SEED_FILE
pnpm --filter @notch/db generate  # after editing src/schema.ts: write a new migration
```

## Seed file

`NOTCH_SEED_FILE` points at a JSON file with one child's records. It holds real health data, so keep it **outside the repository** (relative paths are resolved from the repository root). Shape, validated with Zod in `src/seed.ts`:

```json
{
  "child": { "name": "…", "sex": "female", "birthDate": "YYYY-MM-DD", "birthTime": "HH:MM" },
  "measurements": [
    { "date": "YYYY-MM-DD", "weightKg": 8.4, "lengthCm": 68.5, "estimated": ["weight"] }
  ],
  "vaccinations": [{ "product": "Infanrix Hexa", "doseNo": 1, "date": "YYYY-MM-DD", "place": "…" }],
  "appointments": [
    { "product": "Bexsero", "doseNo": 3, "date": null, "note": "after the first birthday" }
  ]
}
```

The child is matched by name and birth date. Seeding is meant for the first load: if the child already has records (for example entered in the app), it stops instead of overwriting them. Pass `--replace` to replace them anyway: `pnpm --filter @notch/db seed --replace`. Products are matched by code or name, case-insensitively, against the catalog in `@notch/vaccines`.

## Demo data

`fixtures/demo-child.json` is a fictional child ("Mây") with a year and a half of measurements, doses and appointments. The end-to-end tests seed it, and it is the quickest way to try the app without real data:

```bash
DATABASE_URL=pglite:.data/pglite NOTCH_SEED_FILE=packages/db/fixtures/demo-child.json pnpm --filter @notch/db seed
```
