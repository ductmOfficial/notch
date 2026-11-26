# Notch

[![CI](https://github.com/ductmOfficial/notch/actions/workflows/ci.yml/badge.svg)](https://github.com/ductmOfficial/notch/actions/workflows/ci.yml)

**Notch · Sổ lớn khôn của bé.** A web app for parents to track a child's growth against the WHO Child Growth Standards, the vaccination schedule, and health history. The name comes from the marks parents make on a door frame each time they measure their child's height.

> Live at [notch-tmd.vercel.app](https://notch-tmd.vercel.app), with sign-in limited to an allowlist. Today, Growth, Vaccinations and Health screens, forms for measurements, doses, appointments, the health log and temperatures, the national vaccination schedule, calendar download and subscription, a PDF report, backup and restore, and a Settings page, in Vietnamese and English. Sign-in by email link. See [PROGRESS.md](PROGRESS.md).

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
| Domain        | `@notch/growth` (WHO z-scores, percentiles and their reading), `@notch/vaccines` (catalog, appointments)                                     |
| Data          | PostgreSQL or PGlite with Drizzle, Zod validation                                                                                            |
| Testing       | Vitest; Playwright with axe (WCAG 2.2 AA, light and dark, desktop and mobile)                                                                |
| CI            | GitHub Actions (`Verify`, `Browser`), protected `main`, Conventional Commits, Dependabot                                                     |

## Structure

```
.
├── apps/
│   └── web/                    # Next.js app: / (Today), /growth, /vaccines, /health, /child, /settings, /about, /share
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

## Architecture

```mermaid
flowchart LR
  subgraph Device["Phone or computer"]
    Browser["Browser or installed app"]
    SW["Service worker<br/>(offline page only)"]
    Calendar["Calendar app"]
  end

  subgraph Web["apps/web · Next.js on Vercel (sin1)"]
    Proxy["proxy.ts<br/>session cookie check"]
    Pages["Server components<br/>Today, Growth, Vaccines, Health, Child, Settings"]
    Actions["Server actions<br/>role check, then write"]
    Routes["Route handlers<br/>PDF, backup, .ics"]
    Auth["Better Auth<br/>magic link, owners + invites"]
    Demo["Demo database<br/>in-memory PGlite"]
  end

  subgraph Packages["Domain packages (no React)"]
    Growth["@notch/growth<br/>WHO z-scores, readings"]
    Vaccines["@notch/vaccines<br/>catalog, TCMR schedule"]
    Db["@notch/db<br/>Drizzle schema, queries, backup"]
  end

  Postgres[("PostgreSQL · Neon<br/>or PGlite locally")]
  Resend["Resend<br/>sign-in emails"]

  Browser --> Proxy --> Pages
  Browser --> Actions
  Browser -.-> SW
  Calendar -- "secret token" --> Routes
  Pages --> Growth & Vaccines & Db
  Actions --> Db
  Routes --> Db
  Auth --> Db
  Auth --> Resend
  Pages -. "demo browser" .-> Demo
  Db --> Postgres
```

- **Reads** go through server components: a page asks `getDb` for the database (the family's, or the in-memory demo for a demo browser) and renders HTML; no client fetches records.
- **Writes** are server actions: each checks the session, the role (viewers cannot write) and that the child belongs to the signed-in family, then calls `@notch/db`.
- **Rules** live in the domain packages (growth readings, vaccine schedules), tested on their own and reused by the PDF and the calendar.
- **Nothing about a child leaves the server** except the pages themselves, the PDF and the backup the parent downloads; calendar events and emails are generic.

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

| Variable                                                             | Required                | Example                                                              | What it does                                                                                                             |
| -------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                                                       | yes                     | `pglite:.data/pglite` or `postgresql://user:pass@localhost:5433/app` | PGlite folder (relative to the repository root) or a PostgreSQL connection string                                        |
| `NOTCH_ALLOWED_EMAILS`                                               | yes, to sign in         | `you@example.com,partner@example.com`                                | The owners: who may sign in and manage the family, comma-separated. Empty means nobody (relatives are added in Settings) |
| `BETTER_AUTH_SECRET`                                                 | for `start`, production | output of `openssl rand -base64 32`                                  | Signs sessions. Use a different value per environment                                                                    |
| `BETTER_AUTH_URL`                                                    | no                      | `http://localhost:3000`                                              | Where sign-in links point. On Vercel, leave it unset (see Deployment)                                                    |
| `RESEND_API_KEY`                                                     | in production           | `re_xxxxxxxx`                                                        | Sends the sign-in email through Resend. Without it, the link is printed in the `dev` terminal                            |
| `MAIL_FROM`                                                          | no                      | `Notch <onboarding@resend.dev>`                                      | Sender of the sign-in email                                                                                              |
| `MAIL_OUTBOX`                                                        | no                      | `/tmp/notch-outbox.jsonl`                                            | Append emails to this file instead of sending them (the browser tests use it)                                            |
| `NOTCH_SEED_FILE`                                                    | for `seed`              | `packages/db/fixtures/demo-child.json`                               | Records to load. Real records stay in a file **outside the repository**                                                  |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | no                      | `postgres`, `postgres`, `app`, `5433`                                | The local PostgreSQL container (`compose.yaml` has the same defaults); keep `DATABASE_URL` in sync                       |
| `CHROME_PATH`                                                        | no                      | `/usr/bin/google-chrome`                                             | A local Chrome for the browser tests instead of Playwright's Chromium                                                    |

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

### Your own records, from a backup

To try a change on the family's real records without touching the deployed database, run a local copy from a backup. The local app never connects to the deployed database, and nothing syncs between them: refresh the copy with a newer backup when you need it.

1. In the deployed app, open **Settings** and download the backup (`notch-backup-<date>.json`). It holds health data: keep it outside the repository.
2. Create a separate PGlite folder for it (`.data/` is git-ignored), apply the migrations and start the app:

   ```bash
   pnpm build
   export DATABASE_URL=pglite:.data/own
   pnpm --filter @notch/db migrate
   NOTCH_ALLOWED_EMAILS=you@example.com pnpm --filter web dev   # http://localhost:3000
   ```

3. Sign in, open http://localhost:3000/settings (it works before the welcome form is filled in), restore the file and confirm. The restore replaces the local family's children and records.

Next time, start from step 2 without `migrate`. Run `migrate` again only after pulling new migrations, and with `dev` stopped: PGlite lets one process at a time open a folder. A newer backup restores over the old copy the same way; it also replaces what you entered locally.

Keep one folder per set of data (`.data/pglite` for the demo child, `.data/own` for your records). Browsers share cookies across every port of `localhost`, so after switching folders the app may send you to the sign-in page: sign in again.

### With PostgreSQL

```bash
pnpm db:up                         # PostgreSQL 18 on port 5433, waits until healthy
pnpm --filter @notch/db migrate    # apply migrations, load the vaccine catalog
pnpm --filter @notch/db seed       # add the child in NOTCH_SEED_FILE
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
| `pnpm test` / `test:coverage`         | Vitest everywhere / with 90% coverage thresholds on lines, branches and functions (CI runs this one) |
| `pnpm format` / `format:check`        | Prettier write / check                                                                               |
| `pnpm db:up` / `db:down` / `db:reset` | Start / stop / stop and delete local PostgreSQL                                                      |
| `pnpm db:logs` / `db:psql`            | Follow its logs / open `psql` in the container                                                       |
| `pnpm --filter @notch/db migrate`     | Apply migrations to `DATABASE_URL` and load the vaccine catalog                                      |
| `pnpm --filter @notch/db seed`        | Only adds the child in `NOTCH_SEED_FILE` (`--replace` to overwrite); migrate loads the catalog       |
| `pnpm --filter @notch/db generate`    | Write a new migration after editing `packages/db/src/schema.ts`                                      |
| `pnpm --filter web e2e`               | Playwright and axe (after `pnpm build`)                                                              |
| `pnpm --filter web theme`             | Regenerate the color schemes (`apps/web/app/theme.css`)                                              |
| `pnpm --filter web icons`             | Regenerate the inline icons (`components/icons.tsx`)                                                 |

## Sign-in

- **Email link only** ([Better Auth](https://www.better-auth.com) with its magic-link plugin). No passwords to store or leak. A link works once, for 10 minutes.
- **Who may sign in.** The owners in `NOTCH_ALLOWED_EMAILS`, and the relatives an owner added in Settings. Nobody else gets a link or an account. The form answers the same for any address, so it does not reveal who uses Notch. An owner removed from the list, or a relative removed from the family, is signed out on their next request.
- **One household.** Every owner joins the same family (the oldest one, such as the seeded family), so both parents see the same children.
- **Family members and roles.** In Settings, an owner adds a relative by email as an **editor** (adds and changes records) or a **viewer** (reads everything, changes nothing), switches between the two, or removes them. The address may sign in at once; its first sign-in turns the invite into a membership. Viewers see no add or edit controls and get a short note on form pages; every server action checks the role as well, and only owners restore a backup or manage members. Owners stay owners: they come from the environment.
- **First run.** A family without a child lands on `/welcome`, a short form for the first child (name, sex for the WHO charts, date of birth); every other page leads there until it is filled in. No seed file is needed.
- **Child's profile.** Settings lists each child with an edit link (`/child/edit`): the family's name for the child, shown across the app, the birth-certificate and English names (optional), sex, date and time of birth. Only a child of the signed-in family can be changed.
- **Checked on the server.** A proxy sends visitors without a session cookie to `/sign-in`; every page, server action and the calendar route then check the session and that the child belongs to the signed-in family. The calendar feed skips the proxy and shared pages (`/share/<token>`) need no session: their secret token is the credential. The proxy marks shared pages so the layout shows them in the public frame, without the family's navigation or the demo banner, whoever opens them.
- **Mail.** Through Resend when `RESEND_API_KEY` is set; otherwise written to `MAIL_OUTBOX` (the end-to-end tests read it) or printed to the console in development. The email holds only the link, nothing about the child. Sent from Resend's shared `onboarding@resend.dev` address (no domain of your own yet), it can land in Gmail's Spam: mark it as not spam once. A verified domain on Resend also lets addresses other than the Resend account's receive links.
- **Limits.** Better Auth's rate limits (5 link requests a minute per client) are kept in the database, so they hold on serverless hosting.

## Design

- **Material Design 3.** Navigation rail with the floating action button on wide screens; top app bar, bottom navigation bar and a floating FAB on phones. M3 type scale with Roboto Flex, M3 shapes (12px cards, 28px dialogs, fully rounded buttons) and state layers.
- **Lotus palette.** `scripts/generate-theme.mjs` builds the M3 scheme, light and dark, with Google's Material Color Utilities from the colors of a lotus: petal pink (primary), leaf green (tertiary and "done"), stamen yellow ("upcoming") and a cream neutral for surfaces. The colors are generated, not typed by hand; `lib/theme.test.ts` checks WCAG AA contrast for every text and border pairing in both themes.
- **Daylily palette.** A second scheme from the daylily (huyên thảo): orange petal (primary), the green of its long leaves (tertiary) and its yellow throat ("upcoming"). Settings switches between lotus, the default, daylily, cloud, teddy bear and baby; the choice is a `data-palette` attribute on `<html>`, kept in a cookie and rendered on the server. The same contrast test covers every palette.
- **Cloud palette.** A third scheme from the sky (mây): sky blue (primary), the peach of clouds at sunset (tertiary), sun yellow ("upcoming"), leaf green ("done") and a cool cloud-grey neutral.
- **Teddy bear palette.** Caramel fur (primary, kept less saturated so it reads brown rather than orange), the rose of its bow (tertiary), honey yellow ("upcoming") and a warm beige neutral. Drawings: the bear's head, a paw print, a honey pot, a heart, a bow, a trail of paws, and the bear sitting behind the content. Its face is a fixed dark brown, so it stays visible on the lighter fur of the dark theme.
- **Baby palette.** Nursery lavender (primary), baby blue (tertiary), butter yellow ("upcoming") and a soft lilac neutral. Drawings: a rattle, a pacifier, a bottle, a star, the moon with stars and little footprints.
- **Status colors.** "Done" (green), "upcoming" (yellow) and "overdue" (red) keep their meaning in every palette. Green and yellow lean slightly toward the palette's primary color (M3 harmonization, capped at 8°). Given doses are outlined chips with a green check, so strong color is left to what needs action.
- **Sen UI.** Buttons, text fields, selects, checkboxes and dialogs are Sen UI components. Its `--sen-*` tokens point at the M3 color roles, so they follow the scheme; Sen UI sits below Tailwind utilities in the cascade layer order.
- **Palette drawings.** A small mark (`components/Motifs.tsx`, drawings in `components/motifs/`) sits next to the name and on empty states. Faint drawings also sit at the edge of the summary cards on Today and Growth, each card with its own motif, place and tilt: for the lotus a bloom, a bud, a lily pad, a seed pod or fallen petals; for the daylily a flower, buds, leaves, its throat or fallen petals; for the cloud a cumulus, the sun peeking out, stacked clouds, the sun, a rainbow or birds. The favicon (`app/icon.svg`) stays a lotus. Every drawing exists in every palette and CSS shows the current one, so switching needs no reload. Data cards and navigation keep their Material Symbols, so each icon still says what the item is.
- **Watermark.** A faint lotus, daylily or sky, drawn in SVG from the same color roles, sits behind the content in the bottom corner. It is decorative only: hidden from screen readers, never under text on a plain background, and left out of print.
- **Light, dark or system.** Settings has a theme picker. The choice is kept in a cookie and applied on the server, so the page never flashes the wrong theme; "System" follows the device.
- **Vietnamese and English.** Every text comes from `lib/i18n/messages.ts`. The language chosen in Settings is kept in a cookie; otherwise the browser's language is used, with Vietnamese as the fallback. Dates, ages and numbers follow the language.
- **Icons** are Material Symbols (Rounded), generated into `components/icons.tsx` as inline SVG.
- **Growth** shows a card per indicator (weight, length/height, BMI) with its WHO reading and the change since the previous measurement, three across on wide screens. The SVG chart has a wide frame for a full-width card, scrolling sideways on phones, and a compact one for a third of the screen, so labels keep their size. Head circumference is recorded and in the PDF, not charted on screen.

## About page and demo

A signed-out visit to `/` lands on `/about`: what Notch does, and two ways in.

- **Try the demo** (`/demo`) sets a cookie for this browser and opens Today on Mây, the fictional child of `packages/db/fixtures/demo-child.json`, with a few milestones and a short illness added (`apps/web/lib/demo.ts`). The demo reads an in-memory PGlite database built on the first request of each server instance (migrations and catalog included, shipped with every route by `next.config.ts`); it never reads or writes a family's database, and its viewer has the viewer role, so nothing can be changed. A banner on every page says it is a demo, with links to sign in or leave (`/demo/exit`).
- **Sign in** as usual. In the demo, the sign-in page first asks to leave it, so a link signs in to the family rather than the demo.

Sign-in, server actions and the calendar subscription always use the app's database (`getAppDb`); pages read through `getDb`, which picks the demo for a demo browser.

## Install on a phone

Notch is a progressive web app: "Add to Home Screen" (iOS Safari) or "Install app" (Chrome) opens it without the browser bar.

- **Manifest** `app/manifest.ts` (`/manifest.webmanifest`), with icons rendered from `app/icon.svg` on this machine by `pnpm --filter web app-icons`: `public/icons/` (192 and 512 px, and a maskable 512 px) and `app/apple-icon.png` for iOS.
- **Service worker** `public/sw.js`, registered in production builds: it keeps only an offline page (`/offline`, cached without a session) and its stylesheets. Pages and records always come from the network and are never stored on the device, since they hold a child's health data. It is served with `Cache-Control: no-cache`, so a new version takes over on the next visit.
- The manifest, icons, service worker and offline page are served without a session (`proxy.ts`); none of them holds anything about the family.

## Calendar

- **Download** (`/calendar.ics`, signed in): the selected child's upcoming appointments, once.
- **Subscription** (Settings): a link `/calendar/<token>.ics` that calendar apps poll, so appointments stay current. It covers every child of the family. The 256-bit token is the credential: calendar apps have no session, so the proxy lets this path through and the route checks the token. Only its SHA-256 hash is stored, so the link is shown once; creating a new one revokes the old one, and it can be revoked outright. Settings shows when the link was made and last read.
- **Privacy.** Events only say "Vaccine appointment", with reminders a week and a day before. No child's name or vaccine, since calendars sync to other services and show on lock screens.

## Growth reading

Every latest measurement, on Today, on Growth and in the PDF, comes with what it means rather than a bare z-score:

- **WHO's name for it**: normal, stunted, underweight, wasted, possible risk of overweight, overweight, obese, very tall, or a head circumference outside ±2 SD, from WHO's _Interpreting growth indicators_. Green when normal, amber to keep an eye on, red where WHO names a problem.
- **The normal range at the child's age**, in kg or cm ("Normal at 1 year 6 months: 8.1–11.6 kg"), at the age of the measurement, computed from the WHO tables for that day of age.
- **The change since the previous measurement**, when the z-score moved by a whole SD or more (crossing a line of the chart). A fall asks for a doctor even within the normal range; a rise matters for weight, BMI and head circumference. Approximate values are not compared.
- **Advice that never diagnoses**: keep measuring, watch the next measurements, or take the chart (Export PDF) to a paediatrician.

The rules live in `packages/growth/src/assessment.ts` and the wording in `apps/web/lib/growth-assessment.ts`. Percentile and z-score stay in small print.

## Vaccination schedule (TCMR)

The Vaccines screen shows the national expanded programme (Tiêm chủng mở rộng) by age, from Article 1 of **Thông tư 52/2025/TT-BYT** (Ministry of Health, 31 December 2025, in force from 15 February 2026; it replaces Thông tư 10/2024/TT-BYT). Only child doses are included, on the on-time schedule; catch-up rules for late doses are not modelled. Each dose is marked recorded when the child has at least that many doses for the disease from any product, so a service vaccine counts too. This is a reference next to the clinic's own appointments, not a medical assessment. The data lives in `packages/vaccines/src/tcmr.ts`, and a test checks every disease's ages against the circular.

Each dose in the history, on screen and in the PDF, also shows who makes the vaccine and in which country ("GSK, Bỉ"), from the catalog in `packages/vaccines/src/catalog.ts`. It is the usual supply in Vietnam; the label on the box is the reference for a given lot, as a note under the list says.

## Health log

The Health screen (`/health`) keeps the child's illnesses, medicines and doctor's visits, and temperature readings:

- **Going on now** first: entries without an end date (or ending today or later), with a button to add a temperature to an illness, next to the latest reading.
- **Temperatures** by day, in Vietnam time, each with its level against the usual thresholds for children (fever from 38.0 °C, high fever from 39.0 °C; below 36.0 °C asks to measure again). A reading can belong to an entry, such as the illness it was taken during.
- **Advice that never diagnoses**: keep watching and keep the child drinking, ask a doctor if the fever lasts or the child is listless, and see a doctor at once for a baby under three months with a fever. Notch never works out a dose.
- **Today** shows a health card only while something is going on or a reading is less than 48 hours old. The PDF lists the entries and the latest 20 readings, and the child's page shows the entries on the timeline.

**After a vaccine.** From the day of the latest doses to two days later, Today and Vaccines show a follow-up card: what was given, the readings since, what is common in the first day or two (mild fever, fussiness, a sore spot) and the signs that need a doctor at once, with a button to add a temperature (`apps/web/lib/vaccine-follow-up.ts`).

Quick add has "Add a temperature" and "Add to the health log". The rules and wording live in `apps/web/lib/health-view.ts`; the data in `packages/db/src/health.ts`.

## The child's page

Each child has a page (`/child`), reached from the name on Today and from the child's profile in Settings, laid out like a social profile:

- **Cover and avatar**: a wide cover with the current palette's drawing (photos come later), the child's initial in a large circle over its edge, the family's name for the child, the birth-certificate and English names, the age, and buttons to add a milestone and edit the profile.
- **Tabs**: Timeline, About and Milestones (`?tab=`).
- **Timeline**: an intro column (date and time of birth, names), "now" (latest weight and length with their WHO reading, the next vaccine appointment), the latest milestones as tiles and the life path number (just for fun), next to a feed: a box like a post composer that opens the milestone form, filters, then each milestone, measurement and dose as a post, grouped by month.
- **About**: basic info, health, vaccinations and the fun numbers, each with a link to its full page.
- **Milestones**: every milestone as a tile, with a tile to add one. A milestone has a kind (movement, language, teeth, social, other), a title in the family's words with common ones offered for the kind, a date and a note. Milestones are recorded, never assessed: the app never says one came early or late.

The page is for the signed-in family. To show it to someone without an account, Settings has **Share the child's page**:

- An editor or owner creates a link for a child that works for **7 days, 30 days or until revoked**, copies it or opens it, and later sees when it expires and when it was last opened. A new link replaces the old one; revoking stops it at once.
- The shared page (`/share/<token>`) shows the family's name for the child, the age, the latest weight and length with the day they were measured, the number of doses and the diseases covered, and the milestones. It never shows the health log, the birth date and time, or the birth-certificate and English names.
- The token is 32 random bytes, stored as is so the link can be copied again (`packages/db/src/share-links.ts`). The page is served with `noindex`, `no-store` and `no-referrer`, and always reads the app's database, never the demo. An unknown, expired or revoked link shows a page that names no one, and a page left open checks its link again when it comes back into view and every minute, so it closes once the link is revoked or expires.

## Just for fun: numerology

A thin card at the end of Today links to a numerology page for the selected child (`/numerology`), by the Pythagorean method popular in Vietnam, master numbers 11, 22 and 33 kept:

- **Life path**, the main number, with strengths, what to nurture and how parents can help.
- **Other numbers**: expression (the birth-certificate name, or the family's name until one is entered; Vietnamese marks dropped, A=1 … I=9), soul urge (vowels, Y included), personality (consonants), attitude (day and month), birthday, maturity (life path + expression), the English name when there is one, and the personal year.
- **Birth charts**: the digits of the birth date on a 3×3 grid, and a combined chart that adds the letters of the full name. Each is read in full: its full and empty arrows; what every place means by how often its digit appears (once, twice, three times, four or more); the empty places, with what to nurture; the most repeated digit; the totals of the three rows (mental, emotional, physical) and columns (thought, will, action) with the strongest ones; and whether the 5, on four arrows, sits in the middle.
- **What the name adds**: the digits the name fills in and the arrows it completes, compared with the birth date alone.
- **Four pinnacles**: stages of life by age, the current one highlighted.

Every number shows how it was reached. The page says plainly that numerology is entertainment with no scientific basis, and the descriptions are kind and practical, never about health or the future. It is not in the navigation or the PDF, and it reads nothing but the names and the birth date. The calculations live in `apps/web/lib/numerology.ts` and the texts, in Vietnamese and English, in `apps/web/lib/numerology-content.ts`.

## Backup

Settings downloads the family's records as `notch-backup-<date>.json` and restores such a file. The format (version 4, `packages/db/src/backup.ts`) keeps values as stored (grams, millimetres, tenths of a degree, product codes), so a backup restores exactly. Version 2 adds the health log, version 3 the birth-certificate and English names and version 4 the milestones; older files still restore, without what their version did not hold. A restore shows what the file holds, asks for confirmation, checks the whole file (schema, known vaccines, one row per dose), then replaces the family's children and records in one transaction: everything or nothing. The file holds health data; nothing is uploaded anywhere except on restore.

## PDF report

Today has an **Export PDF** button: an A4 record of the selected child for a doctor's visit or to print. Page one holds the profile, the latest weight, length, head circumference and BMI with their WHO reading, normal range, percentile and z-score, and the WHO weight-for-age and length-for-age charts; the next pages list doses by disease, every dose given (date, vaccine, dose, maker and country, place, lot) and the appointments. Every page carries a short disclaimer. It is rendered on the server with [react-pdf](https://react-pdf.org) in the page's language, with Roboto (SIL OFL 1.1, `apps/web/assets/fonts/`) for Vietnamese. The file name is generic (`notch-report-<date>.pdf`).

## Deployment

Vercel for the app, [Neon](https://neon.tech) for PostgreSQL (region `aws-ap-southeast-1`), Resend for the sign-in email.

- **Project settings.** Root directory `apps/web`, framework Next.js, **Node.js 24.x** (a new project defaults to a newer Node, and `pnpm install` then stops with `ERR_PNPM_UNSUPPORTED_ENGINE`).
- **Build and migrate.** `apps/web/vercel.json` sets the build command: `cd ../.. && pnpm exec turbo run build --filter=web && pnpm --filter @notch/db migrate`. It builds the workspace with Turborepo, then applies pending migrations to the database of that environment, so a deployment never runs against an older schema. The same step loads the vaccine catalog (the build log shows `Vaccine catalog synced: …`); deployments are never seeded.
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
| `migrate` fails or waits while `dev` runs on the same PGlite folder                                         | PGlite opens a folder from one process at a time: stop `dev`, run `migrate`, start `dev` again                                                                  |
| After switching to another database folder, the app asks to sign in again                                   | Expected: the browser kept the session of the other database (cookies are shared across `localhost` ports). Sign in again                                       |
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
