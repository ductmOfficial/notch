# Notch

[![CI](https://github.com/ductmOfficial/notch/actions/workflows/ci.yml/badge.svg)](https://github.com/ductmOfficial/notch/actions/workflows/ci.yml)

**Notch · Sổ lớn khôn của bé.** A web app for parents to track a child's growth against the WHO Child Growth Standards, the vaccination schedule, and health history. The name comes from the marks parents make on a door frame each time they measure their child's height.

> Status: runs locally. Today, Growth and Vaccinations screens, forms for measurements, doses and appointments, a calendar download and a Settings page, in Vietnamese and English. **No sign-in yet, so it is not deployed.** See [PROGRESS.md](PROGRESS.md).

## Principles

- Each screen answers one question: is my child growing well, which vaccine is next, how did the last illness go.
- Only occasional events are recorded (measurements, vaccinations, illnesses, doctor visits). No daily feeding, sleep or diaper logs.
- Recording an entry takes at most three taps.
- The app tracks; it does not diagnose or calculate medicine doses.
- Child health data is sensitive: no public links, and no child names or health details in calendars, emails or error reports.

## What's inside

| Area          | Tools                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| App           | Next.js 16 (App Router, Server Components, Server Actions), React 19                                                       |
| Design system | Material Design 3 with a lotus palette, on [Sen UI](https://github.com/ductmOfficial/sen-ui) components and Tailwind CSS 4 |
| Domain        | `@notch/growth` (WHO z-scores and percentiles), `@notch/vaccines` (catalog, appointments)                                  |
| Data          | PostgreSQL or PGlite with Drizzle, Zod validation                                                                          |
| Testing       | Vitest; Playwright with axe (WCAG 2.2 AA, light and dark, desktop and mobile)                                              |
| CI            | GitHub Actions (`Verify`, `Browser`), protected `main`, Conventional Commits, Dependabot                                   |

## Structure

```
.
├── apps/
│   └── web/                    # Next.js app: / (Today), /growth, /vaccines, forms, /calendar.ics
├── packages/
│   ├── growth/                 # @notch/growth: WHO LMS z-scores and percentiles (pure TypeScript)
│   ├── vaccines/               # @notch/vaccines: vaccine catalog, appointments, schedule engine (pure TypeScript)
│   ├── db/                     # @notch/db: Drizzle schema, migrations, queries, seed, demo data
│   ├── eslint-config/          # @repo/eslint-config
│   ├── prettier-config/        # @repo/prettier-config
│   └── typescript-config/      # @repo/typescript-config
├── compose.yaml                # local PostgreSQL 18 on port 5433
└── turbo.json                  # task pipeline
```

The domain packages never import React or Next.js, so a future React Native app can reuse them unchanged.

## Requirements

- Node.js 24 (`.nvmrc`)
- pnpm 12 (pinned in `packageManager`)
- Docker with Compose v2, only for PostgreSQL (PGlite needs nothing)

## Getting started

Try it with the fictional demo child, without Docker:

```bash
pnpm install
pnpm build
export DATABASE_URL=pglite:.data/pglite
pnpm --filter @notch/db migrate
NOTCH_SEED_FILE=packages/db/fixtures/demo-child.json pnpm --filter @notch/db seed
pnpm --filter web dev             # http://localhost:3000
```

With PostgreSQL and your own records instead: `cp .env.example .env`, set `NOTCH_SEED_FILE` to a file **outside the repository**, then `pnpm db:up` and the same `migrate`, `seed` and `dev` commands. PostgreSQL listens on port 5433, so it can run next to other local databases on 5432.

| Script                    | What it does                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `pnpm build`              | Build every package and app                                                            |
| `pnpm lint`               | ESLint everywhere; warnings fail the run                                               |
| `pnpm typecheck`          | `tsc --noEmit` everywhere                                                              |
| `pnpm test`               | Vitest everywhere                                                                      |
| `pnpm --filter web e2e`   | Playwright and axe on a fresh PGlite database with the demo child (after `pnpm build`) |
| `pnpm --filter web theme` | Regenerate the color scheme (`apps/web/app/theme.css`)                                 |
| `pnpm db:up` / `db:psql`  | Start local PostgreSQL / open `psql` in the container                                  |

`e2e` uses Playwright's Chromium (`pnpm --filter web exec playwright install chromium`), or the browser in `CHROME_PATH`.

## Design

- **Material Design 3.** Navigation rail with the floating action button on wide screens; top app bar, bottom navigation bar and a floating FAB on phones. M3 type scale with Roboto Flex, M3 shapes (12px cards, 28px dialogs, fully rounded buttons) and state layers.
- **Lotus palette.** `scripts/generate-theme.mjs` builds the M3 scheme, light and dark, with Google's Material Color Utilities from the colors of a lotus: petal pink (primary), leaf green (tertiary and "done"), stamen yellow ("upcoming") and a cream neutral for surfaces. The colors are generated, not typed by hand; `lib/theme.test.ts` checks WCAG AA contrast for every text and border pairing in both themes.
- **Sen UI.** Buttons, text fields, selects, checkboxes and dialogs are Sen UI components. Its `--sen-*` tokens point at the M3 color roles, so they follow the scheme; Sen UI sits below Tailwind utilities in the cascade layer order.
- **Lotus mark.** A small lotus (`components/LotusMark.tsx`) sits next to the name, on empty states and in the favicon (`app/icon.svg`), Faint lotus drawings also sit at the edge of the summary cards on Today and Growth: a bloom, a bud, a lily pad, a seed pod or fallen petals, each card with its own motif, place and tilt (`components/CardLotus.tsx`). Data cards and navigation keep their Material Symbols, so each icon still says what the item is.
- **Lotus watermark.** A faint lotus, drawn in SVG from the same color roles, sits behind the content in the bottom corner. It is decorative only: hidden from screen readers, never under text on a plain background, and left out of print.
- **Light, dark or system.** Settings has a theme picker. The choice is kept in a cookie and applied on the server, so the page never flashes the wrong theme; "System" follows the device.
- **Vietnamese and English.** Every text comes from `lib/i18n/messages.ts`. The language chosen in Settings is kept in a cookie; otherwise the browser's language is used, with Vietnamese as the fallback. Dates, ages and numbers follow the language.
- **Icons** are Material Symbols (Rounded), generated into `components/icons.tsx` as inline SVG.

## Contributing workflow

1. Branch from `main`: `git switch -c feat/short-description`
2. Commit with [Conventional Commits](https://www.conventionalcommits.org); the `commit-msg` hook enforces it.
3. Open a PR with `gh pr create --fill-first`.
4. Merge with `gh pr merge --rebase --delete-branch` once `Verify` and `Browser` are green.

## Data sources

- WHO Child Growth Standards (0–5 years), LMS tables by day of age, from the WHO [`anthro`](https://github.com/WorldHealthOrganization/anthro) repository. The tables are © World Health Organization; see [packages/growth/README.md](packages/growth/README.md).
- Material Symbols and Material Color Utilities by Google, Apache License 2.0. Roboto Flex, SIL Open Font License.

## License

Code: MIT. Bundled reference data keeps the terms of its source.
