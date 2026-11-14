# Notch

[![CI](https://github.com/ductmOfficial/notch/actions/workflows/ci.yml/badge.svg)](https://github.com/ductmOfficial/notch/actions/workflows/ci.yml)

**Notch · Sổ lớn khôn của bé.** A web app for parents to track a child's growth against the WHO Child Growth Standards, the vaccination schedule, and health history. The name comes from the marks parents make on a door frame each time they measure their child's height.

> Live at [notch-tmd.vercel.app](https://notch-tmd.vercel.app), with sign-in limited to an allowlist. Today, Growth and Vaccinations screens, forms for measurements, doses and appointments, the national vaccination schedule, calendar download and subscription, a PDF report, backup and restore, and a Settings page, in Vietnamese and English. Sign-in by email link. See [PROGRESS.md](PROGRESS.md).

## Principles

- Each screen answers one question: is my child growing well, which vaccine is next, how did the last illness go.
- Only occasional events are recorded (measurements, vaccinations, illnesses, doctor visits). No daily feeding, sleep or diaper logs.
- Recording an entry takes at most three taps.
- The app tracks; it does not diagnose or calculate medicine doses.
- Child health data is sensitive: no public links, and no child names or health details in calendars, emails or error reports.

## What's inside

| Area          | Tools                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| App           | Next.js 16 (App Router, Server Components, Server Actions), React 19                                                                         |
| Design system | Material Design 3 with lotus, daylily and cloud palettes, on [Sen UI](https://github.com/ductmOfficial/sen-ui) components and Tailwind CSS 4 |
| Domain        | `@notch/growth` (WHO z-scores and percentiles), `@notch/vaccines` (catalog, appointments)                                                    |
| Data          | PostgreSQL or PGlite with Drizzle, Zod validation                                                                                            |
| Testing       | Vitest; Playwright with axe (WCAG 2.2 AA, light and dark, desktop and mobile)                                                                |
| CI            | GitHub Actions (`Verify`, `Browser`), protected `main`, Conventional Commits, Dependabot                                                     |

## Structure

```
.
├── apps/
│   └── web/                    # Next.js app: / (Today), /growth, /vaccines, forms, /settings, calendars
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

## Setup

### 1. Prerequisites

| Tool                      | Version                    | Needed for                 | Install                                                                                |
| ------------------------- | -------------------------- | -------------------------- | -------------------------------------------------------------------------------------- |
| Node.js                   | 24 (`.nvmrc`)              | everything                 | `nvm install && nvm use` (or `fnm use`)                                                |
| pnpm                      | 12.14.0 (`packageManager`) | everything                 | `corepack enable` (or `npm install -g pnpm@12.14.0`)                                   |
| Git                       | any recent                 | everything                 |                                                                                        |
| Docker with Compose v2    | any recent                 | PostgreSQL only            | [Docker Desktop](https://docs.docker.com/desktop/) or OrbStack; PGlite needs nothing   |
| Chromium or Google Chrome | any recent                 | browser tests (`e2e`) only | `pnpm --filter web exec playwright install chromium`, or point `CHROME_PATH` at Chrome |

`pnpm install` refuses other Node.js majors (`engineStrict`). Corepack ships with Node.js 24: after `corepack enable`, the first `pnpm` command downloads the exact version from `packageManager` (answer `Y` if it asks).

### 2. Clone and install

```bash
git clone https://github.com/ductmOfficial/notch.git
cd notch
nvm use
corepack enable
pnpm install          # also installs the commit-msg hook
pnpm build            # the db scripts and the app use the packages' build output
```

### 3. Configure

```bash
cp .env.example .env
```

One `.env` at the repository root serves everything: the db scripts read it (`--env-file-if-exists`) and `apps/web/next.config.ts` loads it for the app. It is ignored by git. Variables set in the shell win, so a one-off value can also be passed inline.

| Variable                                                             | Required                | Example                                                              | What it does                                                                                       |
| -------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                       | yes                     | `pglite:.data/pglite` or `postgresql://user:pass@localhost:5433/app` | PGlite folder (relative to the repository root) or a PostgreSQL connection string                  |
| `NOTCH_ALLOWED_EMAILS`                                               | yes, to sign in         | `you@example.com,partner@example.com`                                | Who may sign in, comma-separated. Empty means nobody                                               |
| `BETTER_AUTH_SECRET`                                                 | for `start`, production | output of `openssl rand -base64 32`                                  | Signs sessions. Use a different value per environment                                              |
| `BETTER_AUTH_URL`                                                    | no                      | `http://localhost:3000`                                              | Where sign-in links point. On Vercel, leave it unset (see Deployment)                              |
| `RESEND_API_KEY`                                                     | in production           | `re_xxxxxxxx`                                                        | Sends the sign-in email through Resend. Without it, the link is printed in the `dev` terminal      |
| `MAIL_FROM`                                                          | no                      | `Notch <onboarding@resend.dev>`                                      | Sender of the sign-in email                                                                        |
| `MAIL_OUTBOX`                                                        | no                      | `/tmp/notch-outbox.jsonl`                                            | Append emails to this file instead of sending them (the browser tests use it)                      |
| `NOTCH_SEED_FILE`                                                    | for `seed`              | `packages/db/fixtures/demo-child.json`                               | Records to load. Real records stay in a file **outside the repository**                            |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | no                      | `postgres`, `postgres`, `app`, `5433`                                | The local PostgreSQL container (`compose.yaml` has the same defaults); keep `DATABASE_URL` in sync |
| `CHROME_PATH`                                                        | no                      | `/usr/bin/google-chrome`                                             | A local Chrome for the browser tests instead of Playwright's Chromium                              |

## Running

### Quick try: PGlite and the demo child

No Docker and no `.env` needed. Mây, the demo child in `packages/db/fixtures/demo-child.json`, is fictional:

```bash
export DATABASE_URL=pglite:.data/pglite
pnpm --filter @notch/db migrate
NOTCH_SEED_FILE=packages/db/fixtures/demo-child.json pnpm --filter @notch/db seed
NOTCH_ALLOWED_EMAILS=you@example.com pnpm --filter web dev   # http://localhost:3000
```

Open http://localhost:3000 and sign in with that address: without a mail service, the sign-in link is printed in the terminal running `dev`. Skip the seed to start from the welcome page instead.

### With PostgreSQL

```bash
pnpm db:up                         # PostgreSQL 18 on port 5433, waits until healthy
pnpm --filter @notch/db migrate    # apply migrations
pnpm --filter @notch/db seed       # migrate, sync the vaccine catalog, load NOTCH_SEED_FILE
pnpm --filter web dev              # http://localhost:3000
```

This uses the values in `.env`: set `NOTCH_ALLOWED_EMAILS`, and point `NOTCH_SEED_FILE` at the demo file or at your own records outside the repository. PostgreSQL listens on port 5433, so it can run next to another local database on 5432. `pnpm db:psql` opens `psql` in the container; `pnpm db:down` stops it and keeps the data, `pnpm db:reset` deletes the data.

### Production build

```bash
pnpm build
BETTER_AUTH_SECRET="$(openssl rand -base64 32)" pnpm --filter web start   # http://localhost:3000
```

`next start` runs in production mode, where Better Auth refuses its default secret: without `BETTER_AUTH_SECRET` (in `.env` or inline as above) every page answers 500. It also needs `DATABASE_URL` and `NOTCH_ALLOWED_EMAILS`, like `dev`, and sends the sign-in email only through Resend or `MAIL_OUTBOX`.

## Testing

| Command                             | What it runs                                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------- |
| `pnpm test`                         | Vitest everywhere: WHO z-scores, vaccine schedule, db queries on in-memory PGlite, app logic |
| `pnpm lint` / `pnpm typecheck`      | ESLint (warnings fail) and `tsc --noEmit` everywhere                                         |
| `pnpm format:check` / `pnpm format` | Prettier check / write                                                                       |
| `pnpm build`                        | Build every package and the app                                                              |
| `pnpm --filter web e2e`             | Playwright and axe (WCAG 2.2 AA), light and dark, desktop and mobile, after `pnpm build`     |

The browser tests need no `.env` and no Docker. Each run starts two `next start` servers on ports 3200 and 3201 with fresh PGlite databases (`apps/web/.e2e-db` with the demo child, `apps/web/.e2e-db-empty` without), signs in through the real email-link flow from a file outbox, and uses Playwright's Chromium or the browser in `CHROME_PATH`:

```bash
pnpm --filter web exec playwright install chromium
pnpm build
pnpm --filter web e2e
```

To run what CI runs before opening a pull request (`Verify`, then `Browser`):

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm turbo run lint typecheck test build
pnpm --filter web e2e
```

### All scripts

| Script                                | What it does                                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `pnpm build`                          | Build every package and app                                                                          |
| `pnpm dev`                            | Every package's `dev` task (the app's `next dev`)                                                    |
| `pnpm lint`                           | ESLint everywhere; warnings fail the run                                                             |
| `pnpm typecheck`                      | `tsc --noEmit` everywhere                                                                            |
| `pnpm test` / `test:coverage`         | Vitest everywhere / with coverage thresholds (not run by CI; `web` is below its 90% threshold today) |
| `pnpm format` / `format:check`        | Prettier write / check                                                                               |
| `pnpm db:up` / `db:down` / `db:reset` | Start / stop / stop and delete local PostgreSQL                                                      |
| `pnpm db:logs` / `db:psql`            | Follow its logs / open `psql` in the container                                                       |
| `pnpm --filter @notch/db migrate`     | Apply migrations to `DATABASE_URL`                                                                   |
| `pnpm --filter @notch/db seed`        | Migrate, sync the catalog, load `NOTCH_SEED_FILE` (`--replace` to overwrite)                         |
| `pnpm --filter @notch/db generate`    | Write a new migration after editing `packages/db/src/schema.ts`                                      |
| `pnpm --filter web e2e`               | Playwright and axe (after `pnpm build`)                                                              |
| `pnpm --filter web theme`             | Regenerate the color schemes (`apps/web/app/theme.css`)                                              |
| `pnpm --filter web icons`             | Regenerate the inline icons (`components/icons.tsx`)                                                 |

## Sign-in

- **Email link only** ([Better Auth](https://www.better-auth.com) with its magic-link plugin). No passwords to store or leak. A link works once, for 10 minutes.
- **Allowlist.** Only the addresses in `NOTCH_ALLOWED_EMAILS` get a link or an account. The form answers the same for any address, so it does not reveal who uses Notch. Someone removed from the list is signed out on their next request.
- **One household.** Everyone on the allowlist joins the same family (the oldest one, such as the seeded family), so both parents see the same children.
- **First run.** A family without a child lands on `/welcome`, a short form for the first child (name, sex for the WHO charts, date of birth); every other page leads there until it is filled in. No seed file is needed.
- **Checked on the server.** A proxy sends visitors without a session cookie to `/sign-in`; every page, server action and the calendar route then check the session and that the child belongs to the signed-in family.
- **Mail.** Through Resend when `RESEND_API_KEY` is set; otherwise written to `MAIL_OUTBOX` (the end-to-end tests read it) or printed to the console in development. The email holds only the link, nothing about the child. Sent from Resend's shared `onboarding@resend.dev` address (no domain of your own yet), it can land in Gmail's Spam: mark it as not spam once. A verified domain on Resend also lets addresses other than the Resend account's receive links.
- **Limits.** Better Auth's rate limits (5 link requests a minute per client) are kept in the database, so they hold on serverless hosting.

## Design

- **Material Design 3.** Navigation rail with the floating action button on wide screens; top app bar, bottom navigation bar and a floating FAB on phones. M3 type scale with Roboto Flex, M3 shapes (12px cards, 28px dialogs, fully rounded buttons) and state layers.
- **Lotus palette.** `scripts/generate-theme.mjs` builds the M3 scheme, light and dark, with Google's Material Color Utilities from the colors of a lotus: petal pink (primary), leaf green (tertiary and "done"), stamen yellow ("upcoming") and a cream neutral for surfaces. The colors are generated, not typed by hand; `lib/theme.test.ts` checks WCAG AA contrast for every text and border pairing in both themes.
- **Daylily palette.** A second scheme from the daylily (huyên thảo): orange petal (primary), the green of its long leaves (tertiary) and its yellow throat ("upcoming"). Settings switches between lotus, the default, daylily and cloud; the choice is a `data-palette` attribute on `<html>`, kept in a cookie and rendered on the server. The same contrast test covers every palette.
- **Cloud palette.** A third scheme from the sky (mây): sky blue (primary), the peach of clouds at sunset (tertiary), sun yellow ("upcoming"), leaf green ("done") and a cool cloud-grey neutral.
- **Status colors.** "Done" (green), "upcoming" (yellow) and "overdue" (red) keep their meaning in every palette. Green and yellow lean slightly toward the palette's primary color (M3 harmonization, capped at 8°). Given doses are outlined chips with a green check, so strong color is left to what needs action.
- **Sen UI.** Buttons, text fields, selects, checkboxes and dialogs are Sen UI components. Its `--sen-*` tokens point at the M3 color roles, so they follow the scheme; Sen UI sits below Tailwind utilities in the cascade layer order.
- **Palette drawings.** A small mark (`components/Motifs.tsx`, drawings in `components/motifs/`) sits next to the name and on empty states. Faint drawings also sit at the edge of the summary cards on Today and Growth, each card with its own motif, place and tilt: for the lotus a bloom, a bud, a lily pad, a seed pod or fallen petals; for the daylily a flower, buds, leaves, its throat or fallen petals; for the cloud a cumulus, the sun peeking out, stacked clouds, the sun, a rainbow or birds. The favicon (`app/icon.svg`) stays a lotus. Every drawing exists in every palette and CSS shows the current one, so switching needs no reload. Data cards and navigation keep their Material Symbols, so each icon still says what the item is.
- **Watermark.** A faint lotus, daylily or sky, drawn in SVG from the same color roles, sits behind the content in the bottom corner. It is decorative only: hidden from screen readers, never under text on a plain background, and left out of print.
- **Light, dark or system.** Settings has a theme picker. The choice is kept in a cookie and applied on the server, so the page never flashes the wrong theme; "System" follows the device.
- **Vietnamese and English.** Every text comes from `lib/i18n/messages.ts`. The language chosen in Settings is kept in a cookie; otherwise the browser's language is used, with Vietnamese as the fallback. Dates, ages and numbers follow the language.
- **Icons** are Material Symbols (Rounded), generated into `components/icons.tsx` as inline SVG.

## Calendar

- **Download** (`/calendar.ics`, signed in): the selected child's upcoming appointments, once.
- **Subscription** (Settings): a link `/calendar/<token>.ics` that calendar apps poll, so appointments stay current. It covers every child of the family. The 256-bit token is the credential: calendar apps have no session, so the proxy lets this path through and the route checks the token. Only its SHA-256 hash is stored, so the link is shown once; creating a new one revokes the old one, and it can be revoked outright. Settings shows when the link was made and last read.
- **Privacy.** Events only say "Vaccine appointment", with reminders a week and a day before. No child's name or vaccine, since calendars sync to other services and show on lock screens.

## Vaccination schedule (TCMR)

The Vaccines screen shows the national expanded programme (Tiêm chủng mở rộng) by age, from Article 1 of **Thông tư 52/2025/TT-BYT** (Ministry of Health, 31 December 2025, in force from 15 February 2026; it replaces Thông tư 10/2024/TT-BYT). Only child doses are included, on the on-time schedule; catch-up rules for late doses are not modelled. Each dose is marked recorded when the child has at least that many doses for the disease from any product, so a service vaccine counts too. This is a reference next to the clinic's own appointments, not a medical assessment. The data lives in `packages/vaccines/src/tcmr.ts`, and a test checks every disease's ages against the circular.

## Backup

Settings downloads the family's records as `notch-backup-<date>.json` and restores such a file. The format (version 1, `packages/db/src/backup.ts`) keeps values as stored (grams, millimetres, product codes), so a backup restores exactly. A restore shows what the file holds, asks for confirmation, checks the whole file (schema, known vaccines, one row per dose), then replaces the family's children and records in one transaction: everything or nothing. The file holds health data; nothing is uploaded anywhere except on restore.

## PDF report

Today has an **Export PDF** button: an A4 record of the selected child for a doctor's visit or to print. Page one holds the profile, the latest weight, length, head circumference and BMI with percentile and z-score, and the WHO weight-for-age and length-for-age charts; the next pages list doses by disease, every dose given (date, vaccine, dose, place, lot) and the appointments. Every page carries a short disclaimer. It is rendered on the server with [react-pdf](https://react-pdf.org) in the page's language, with Roboto (SIL OFL 1.1, `apps/web/assets/fonts/`) for Vietnamese. The file name is generic (`notch-report-<date>.pdf`).

## Deployment

Vercel for the app, [Neon](https://neon.tech) for PostgreSQL (region `aws-ap-southeast-1`), Resend for the sign-in email.

- **Project settings.** Root directory `apps/web`, framework Next.js, **Node.js 24.x** (a new project defaults to a newer Node, and `pnpm install` then stops with `ERR_PNPM_UNSUPPORTED_ENGINE`).
- **Build and migrate.** `apps/web/vercel.json` sets the build command: `cd ../.. && pnpm exec turbo run build --filter=web && pnpm --filter @notch/db migrate`. It builds the workspace with Turborepo, then applies pending migrations to the database of that environment, so a deployment never runs against an older schema.
- **Databases.** Production and Preview use different Neon branches. The preview branch holds only the fictional demo child, never a copy of production.
- **Variables**, per Vercel environment (names only; values live in Vercel):

| Variable               | Production                    | Preview                     |
| ---------------------- | ----------------------------- | --------------------------- |
| `DATABASE_URL`         | Neon pooled connection string | the preview branch's string |
| `BETTER_AUTH_SECRET`   | its own value                 | a different value           |
| `NOTCH_ALLOWED_EMAILS` | the parents' addresses        | the addresses that may test |
| `RESEND_API_KEY`       | set                           | set                         |
| `MAIL_FROM`            | set                           | set                         |
| `BETTER_AUTH_URL`      | unset, or a custom domain     | unset                       |

Without `BETTER_AUTH_URL`, sign-in links point at the production domain in production and at the branch URL in previews (see `lib/site-url.ts`). `turbo.json` passes these variables through to the build.

## Troubleshooting

| Symptom                                                                                                     | Fix                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install` fails with `ERR_PNPM_UNSUPPORTED_ENGINE`                                                     | Wrong Node.js major: `nvm use` (Node.js 24), then install again. On Vercel, set Node.js 24.x in the project settings                                            |
| `pnpm: command not found`, or a different pnpm version runs                                                 | `corepack enable`, then open a new terminal; `pnpm -v` should print `12.14.0`                                                                                   |
| "DATABASE_URL is not set. Copy .env.example to .env, or pass it inline."                                    | Create `.env` from `.env.example`, or `export DATABASE_URL=pglite:.data/pglite`                                                                                 |
| `migrate` or `seed` cannot find its script                                                                  | Run `pnpm build` first: the db scripts run from `packages/db/dist`                                                                                              |
| `seed` cannot read the seed file                                                                            | `NOTCH_SEED_FILE` is resolved from the repository root; for a try, use `packages/db/fixtures/demo-child.json`                                                   |
| `pnpm db:up` fails with "port is already allocated"                                                         | Something already uses 5433: set `POSTGRES_PORT` in `.env` and the same port in `DATABASE_URL`                                                                  |
| Port 3000 is taken                                                                                          | `pnpm --filter web dev --port 3001`, and set `BETTER_AUTH_URL=http://localhost:3001` so the sign-in link matches                                                |
| `e2e` cannot start its servers                                                                              | Ports 3200 and 3201 must be free, and `pnpm build` must have run                                                                                                |
| The browser tests cannot find a browser                                                                     | `pnpm --filter web exec playwright install chromium`, or set `CHROME_PATH`                                                                                      |
| Every page answers 500 after `pnpm --filter web start`, and the log says "You are using the default secret" | Set `BETTER_AUTH_SECRET` (`openssl rand -base64 32`) in `.env` or inline                                                                                        |
| No sign-in email arrives                                                                                    | Check that the address is in `NOTCH_ALLOWED_EMAILS` (the form answers the same either way). Locally without `RESEND_API_KEY`, the link is in the `dev` terminal |
| The sign-in email is in Spam                                                                                | Mail sent from `onboarding@resend.dev` can land in Gmail's Spam: mark it as not spam once. A verified domain on Resend avoids it                                |
| A Vercel preview opens a Vercel sign-in page                                                                | Previews have Deployment Protection: sign in to Vercel with an account on the team first, or check the commit locally                                           |
| The sign-in link from a preview asks for Vercel sign-in again and fails                                     | Open the preview through its branch URL and leave `BETTER_AUTH_URL` unset in Preview, so the link points at the branch URL                                      |
| A machine with little memory kills the run (exit code 137)                                                  | Run fewer tasks at once: `pnpm turbo run lint typecheck test build --concurrency=2`                                                                             |
| The commit is rejected                                                                                      | The hook enforces [Conventional Commits](https://www.conventionalcommits.org): `feat(web): …`, `fix(db): …`, `docs: …`                                          |

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
