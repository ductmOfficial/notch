# Progress

> Last updated: 2026-11-20
>
> Legend: ✅ done · 🔄 in progress · ⬜ not started

Notch tracks a child's growth, vaccinations and health. This repo was created from [`ductran-starter`](https://github.com/ductmOfficial/ductran-starter). This log records each step, the decisions behind it and the issues met along the way.

## Phases

| Phase | Scope                                                                       | Status |
| ----- | --------------------------------------------------------------------------- | ------ |
| P0    | Foundation: growth and vaccines engines, database, app skeleton             | ✅     |
| P1    | Today, Growth and Vaccinations screens, forms, `.ics` calendar, design, E2E | ✅     |
| P2    | Health log, post-vaccination follow-up, family sharing (PDF done in P1)     | ✅     |
| P3    | PWA, demo mode, deployment                                                  | ✅     |
| P4    | Sharing outside the family: a public read-only link to the child's page     | ✅     |

## Steps

| #   | Step                                                                        | Branch                        | Status |
| --- | --------------------------------------------------------------------------- | ----------------------------- | ------ |
| 1   | Repository from the `ductran-starter` template                              | `main`                        | ✅     |
| 2   | Rename to `notch`, drop the sample package, PostgreSQL on port 5433         | `chore/setup`                 | ✅     |
| 3   | `@notch/growth`: WHO LMS z-scores and percentiles, generated data           | `feat/growth`                 | ✅     |
| 4   | `@notch/vaccines`: catalog, appointments, schedule engine                   | `feat/vaccines`               | ✅     |
| 5   | `@notch/db`: schema, migrations, queries, mutations, seed, demo data        | `feat/db`                     | ✅     |
| 6   | Today, Growth and Vaccinations screens                                      | `feat/web`                    | ✅     |
| 7   | Forms for measurements, doses and appointments; `.ics` download             | `feat/forms`                  | ✅     |
| 8   | Material Design 3 with a lotus palette, on Sen UI                           | `feat/theme`                  | ✅     |
| 9   | Playwright and axe tests, `Browser` job in CI                               | `test/e2e`                    | ✅     |
| 10  | README and this progress log                                                | `docs/readme`                 | ✅     |
| 11  | Settings page with a light, dark or system theme                            | `feat/theme-setting`          | ✅     |
| 12  | Vietnamese and English, chosen in Settings                                  | `feat/i18n`                   | ✅     |
| 13  | Lotus watermark behind the content                                          | `feat/lotus-backdrop`         | ✅     |
| 14  | Add button flat in the navigation rail                                      | `fix/rail-fab-flat`           | ✅     |
| 15  | Lotus mark next to the name, on empty states, as the favicon                | `feat/lotus-mark`             | ✅     |
| 16  | Lotus drawings on the summary cards                                         | `feat/card-lotus`             | ✅     |
| 17  | Daylily (huyên thảo) palette and drawings, chosen in Settings               | `feat/daylily-palette`        | ✅     |
| 18  | Cloud (mây) palette and drawings                                            | `feat/cloud-palette`          | ✅     |
| 19  | Quiet chips for given doses; status colors harmonized                       | `feat/quiet-done`             | ✅     |
| 20  | Reload settings only once the choice is saved (test)                        | `test/settings-cookie`        | ✅     |
| 21  | Sign-in by email link with an allowlist; data limited to the family         | `feat/auth`                   | ✅     |
| 22  | Welcome page for the first child                                            | `feat/onboarding`             | ✅     |
| 23  | Ready for Vercel and Neon: build with migrations, sign-in URLs on Vercel    | `chore/vercel`                | ✅     |
| 24  | Calendar subscription link with a secret token                              | `feat/calendar-feed`          | ✅     |
| 25  | Build log and dependency housekeeping after the first deployment            | `chore/build-hygiene`         | ✅     |
| 26  | Backup and restore as a JSON file                                           | `feat/backup`                 | ✅     |
| 27  | PDF report of a child                                                       | `feat/pdf`                    | ✅     |
| 28  | National schedule (TCMR) by age on the Vaccines screen                      | `feat/tcmr`                   | ✅     |
| 29  | Health log data: tables, queries, backup version 2                          | `feat/health-log-db`          | ✅     |
| 30  | Faster navigation: loading state, session cookie cache, one family query    | `perf/faster-navigation`      | ✅     |
| 31  | Maker and country of each vaccine, on the Vaccines screen and in the PDF    | `feat/vaccine-origin`         | ✅     |
| 32  | Appointments lead with the diseases, then the vaccine and dose              | `feat/appointment-diseases`   | ✅     |
| 33  | Growth reading: WHO classification, normal range, change, advice            | `feat/growth-assessment`      | ✅     |
| 34  | Wider content; Growth shows three chart cards, each with its reading        | `fix/growth-cards-grid`       | ✅     |
| 35  | Teddy bear (gấu bông) and baby (em bé) palettes and drawings                | `feat/teddy-baby-palettes`    | ✅     |
| 36  | Numerology page, just for fun, reached from a card on Today                 | `feat/numerology`             | ✅     |
| 37  | Child's profile: birth-certificate and English names, birth time            | `feat/child-profile`          | ✅     |
| 38  | Numerology in depth: more numbers, two birth charts, pinnacles, guidance    | `feat/numerology-more`        | ✅     |
| 39  | The child's page like a social profile: cover, tabs, feed, milestones       | `feat/child-page`             | ✅     |
| 40  | Backlog: PDF minus signs, next dose number, phone chart axis, restore       | `fix/backlog`                 | ✅     |
| 41  | Health screen: entries, temperatures, quick add, Today, PDF, timeline       | `feat/health-log`             | ✅     |
| 42  | Follow-up after a vaccine: temperatures for two days, on Today and Vaccines | `feat/vaccine-follow-up`      | ✅     |
| 43  | Family sharing: owners add relatives as editors or viewers                  | `feat/family-sharing`         | ✅     |
| 44  | Installable app: manifest, icons, a service worker with an offline page     | `feat/pwa`                    | ✅     |
| 45  | About page and a read-only demo on an in-memory database                    | `feat/demo`                   | ✅     |
| 46  | Architecture diagram; tests run with 90% coverage in CI                     | `chore/coverage-architecture` | ✅     |
| 47  | Public share link to the child's page, for a week, a month or until revoked | `feat/share-link`             | ✅     |

Each step is a pull request with green checks (`Browser` from step 9), merged with rebase.

### Still open in P0 and P1

- [x] Sign-in (Better Auth, magic link, allowlist)
- [x] Onboarding: the first child after the first sign-in
- [x] Vercel and Neon deploys (production with an empty family, preview with the demo child)
- [x] `.ics` subscription URL
- [x] Vietnamese EPI (TCMR) schedule data, from Thông tư 52/2025/TT-BYT

## Decisions

| Decision                                                                | Reason                                                                                                                                                                                                   |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WHO data by day of age                                                  | `anthro` publishes LMS values for every day from 0 to 1826, so no interpolation between monthly rows is needed                                                                                           |
| Restricted extrapolation beyond ±3 SD for weight-based indicators       | As WHO specifies; length/height and head circumference use the plain LMS formula                                                                                                                         |
| TCMR data typed from the circular, checked by a test                    | No machine-readable source exists; Article 1 of Thông tư 52/2025/TT-BYT was transcribed dose by dose and a test pins every disease's ages to it                                                          |
| Appointments over schedules                                             | Real records show the clinic books every next dose, so the app reminds from appointments; `planDoses` stays for suggestions                                                                              |
| Doses per product, shown per disease                                    | One product can cover several diseases (Infanrix Hexa covers six)                                                                                                                                        |
| Approximate values flagged per value                                    | A record can have an approximate weight and an exact length                                                                                                                                              |
| PGlite next to PostgreSQL                                               | The same Drizzle code runs on both; tests, E2E and Docker-free local runs use PGlite                                                                                                                     |
| Seed is for the first load only                                         | It refuses to overwrite a child that already has records unless `--replace` is passed, so data entered in the app is kept                                                                                |
| A fictional demo child in the repository                                | E2E and demos need data; real records stay outside the repository                                                                                                                                        |
| Calendar titles stay generic ("Lịch tiêm cho bé")                       | Calendars sync to other services and show on lock screens                                                                                                                                                |
| Server-rendered SVG chart                                               | No chart library and no client JavaScript; the table repeats the data                                                                                                                                    |
| Material Design 3                                                       | A widely known system with published guidance for color, type, shape and layout; familiar to phone users                                                                                                 |
| Lotus palette generated with Material Color Utilities                   | Colors come from four seed colors, light and dark, with contrast built in; a unit test checks AA for every pairing                                                                                       |
| Sen UI tokens mapped to M3 color roles                                  | Sen UI components follow the scheme without forking them; the same token approach restyles the portfolio                                                                                                 |
| Forms moved to Sen UI with the design system                            | One switch for every control; the first forms used native inputs behind one module so the swap touched only that module                                                                                  |
| Deleting asks in an `alertdialog`                                       | A single tap never deletes; Cancel keeps focus where it was                                                                                                                                              |
| `@material/material-color-utilities` 0.3.x                              | 0.4.0 imports its own files without extensions, which Node's ESM loader rejects                                                                                                                          |
| E2E on a fresh PGlite database, flows on desktop only                   | Tests are independent of any local data; flows change data, so they run once while accessibility runs on desktop and mobile                                                                              |
| Browser checks with the runner's Chrome                                 | No browser download and no apt packages in CI; Playwright's Chromium stays the fallback                                                                                                                  |
| Theme kept in a cookie and applied on the server                        | The page never flashes the wrong theme on load; "System" removes the cookie and follows the device                                                                                                       |
| Language from a cookie, then the browser; no locale in URLs             | The app is private and not indexed, so URLs stay short; Vietnamese is the fallback                                                                                                                       |
| Flat dictionaries, Vietnamese as the reference                          | TypeScript rejects unknown keys; a unit test keeps English on the same keys and placeholders                                                                                                             |
| Lotus drawn in SVG, not a photo                                         | It takes its colors from the scheme, so it follows light and dark, weighs a few hundred bytes and needs no image license                                                                                 |
| The lotus mark stays off data cards and navigation                      | Those icons tell what an item is (weight, vaccine, settings); the lotus is the brand, shown where nothing else needs saying                                                                              |
| Palettes switch with a `data-palette` attribute and CSS                 | Every scheme is in `theme.css` and every drawing is rendered for every palette, so the page repaints at once; the cookie only serves the next visit                                                      |
| Daylily as a second palette, lotus stays the default                    | In East Asian tradition the daylily stands for the mother; parents can pick the flower they prefer                                                                                                       |
| Cloud palette with its own "done" green                                 | Sky blue, sunset peach and sun yellow carry the theme; "done" stays green so its meaning does not change with the palette                                                                                |
| Given doses as outlined chips with a green check                        | A given dose is the normal state; strong color is kept for what needs action (overdue, upcoming), so a long list does not turn the page green                                                            |
| Status colors harmonized toward the primary, at most 8°                 | As M3 does for custom colors; at the usual 15° the lotus's "done" green turned olive                                                                                                                     |
| Better Auth with magic links only                                       | No passwords to store; the library owns sessions, tokens and rate limits instead of hand-written code                                                                                                    |
| Allowlist in an environment variable                                    | Notch is for one household; adding a parent is a setting, not a sign-up page. The form answers the same for every address                                                                                |
| Everyone on the allowlist shares one family                             | Both parents see the same children without an invite flow; invitations can come with family sharing in P2                                                                                                |
| Session checked on the server, the proxy only redirects                 | The proxy reads the cookie for a quick redirect; pages, actions and routes still verify the session and the child's family                                                                               |
| Rate limits stored in the database                                      | Memory limits reset per serverless instance; a table keeps them across instances                                                                                                                         |
| Sign-in tests through the real flow                                     | The setup project requests a link, reads it from the test outbox and stores the session for the other tests                                                                                              |
| Onboarding asks only name, sex and date of birth                        | The WHO charts need sex and age; everything else (measurements, doses) has its own form                                                                                                                  |
| A second e2e server with an empty database                              | The first run can only be tested on a family without a child; the main server keeps the demo child                                                                                                       |
| Migrations run in the Vercel build                                      | Each environment's database is migrated before its deployment goes live; the changes so far only add tables and columns                                                                                  |
| Sign-in URL from Vercel's variables when BETTER_AUTH_URL is unset       | Preview URLs change with every deployment; the deployment, branch and production hosts are trusted                                                                                                       |
| Calendar subscription by secret token, stored hashed                    | Calendar apps cannot sign in; a 256-bit token in the URL is the usual way. A hash means a database leak does not leak working links; the price is that the link is shown only once                       |
| One calendar link per family, covering every child                      | Fewer links to manage and revoke; events stay generic, so mixing children reveals nothing                                                                                                                |
| Backups in stored units, without ids                                    | Grams and millimetres restore without rounding; fresh ids avoid clashes with rows another family or an older restore created                                                                             |
| A restore replaces the family's data in one transaction                 | Merging would need rules for conflicts; a full replace after a confirmation is predictable, and a failure changes nothing                                                                                |
| PDF with react-pdf on the server                                        | Pure JavaScript, so it runs on Vercel without a headless browser; the charts are drawn again as PDF vector paths from the same chart model                                                               |
| Fonts in the repository, print colors fixed                             | The PDF must render the same everywhere and cover Vietnamese; the lotus colors read well on paper whatever the chosen palette                                                                            |
| TCMR shown as a reference per disease, not as a plan                    | A service vaccine can cover a disease on another schedule; counting doses per disease and saying so avoids false alarms, and the app does not diagnose                                                   |
| Health log data before its screens                                      | The tables ship empty and unused, so the migration reaches production on its own; the screens follow in the next step                                                                                    |
| Temperatures in tenths of a degree, as integers                         | Like grams and millimetres: no float rounding; 34.0 to 43.0 °C is checked by Zod and by the database                                                                                                     |
| A temperature may belong to a health entry of the same child            | A fever's readings read together; the link is optional, and deleting the entry keeps the readings                                                                                                        |
| Backup version 2 keeps reading version 1                                | Files saved before the health log stay usable; a temperature points at its entry by position, since backups hold no ids                                                                                  |
| Each migration tested over existing records                             | Production migrates on every deployment; the test applies the latest migration to a database with records and compares every row                                                                         |
| Functions in Singapore (`sin1`), next to the database                   | Every query crossed from the default US region to Neon in Singapore, about a quarter of a second each, several in a row per page                                                                         |
| A loading state at the root                                             | Navigation answers at once with a placeholder, and Next.js can prefetch the layout down to it                                                                                                            |
| Session cookie cache for five minutes                                   | Most requests skip the session query; the allowlist is still checked on every request, and a revoked session ends within five minutes                                                                    |
| Family and children in one query                                        | Every page needs both; one round trip instead of two                                                                                                                                                     |
| Vaccine origin kept in the catalog, not the database                    | The screens read the catalog directly, so no migration is needed; the box label stays the reference for each lot, as the app says                                                                        |
| Country names written in Vietnamese and English, not from `Intl`        | `Intl.DisplayNames` gives "Italy" and "Hoa Kỳ" in Vietnamese and varies between engines; parents say "Ý" and "Mỹ"                                                                                        |
| Appointments name the diseases first                                    | Parents think in diseases ("flu", "meningococcal B"); the vaccine and dose stay on the next line, as the clinic books them                                                                               |
| Growth readings use WHO's names for each band                           | Parents asked whether a value is fine and where the limits are; WHO's published reading is the reference, shown with its source and a note that it is not a diagnosis                                    |
| Advice only points to a doctor                                          | The app keeps measuring and comparing; it never names a cause or a treatment                                                                                                                             |
| A fall of 1 SD between two measurements asks for a doctor               | Crossing a line of the chart is what WHO asks to look into, even within the normal range; approximate values are left out of the comparison                                                              |
| One chart card per indicator, head circumference left to the PDF        | Weight, length and BMI side by side answer "is she growing well" at a glance; head circumference is recorded and printed, not charted on screen                                                          |
| A compact chart frame for three columns                                 | SVG text scales with the frame; a narrower frame keeps labels near their size in a third of the screen, and the wide frame stays for one column                                                          |
| Teddy bear and baby palettes, "done" still green                        | Parents asked for softer, child-themed looks; a quieter primary makes caramel read brown, and "done" keeps its meaning across every palette                                                              |
| Numerology kept apart from the health record                            | Asked for as entertainment; it has no scientific basis, so a thin card labelled "just for fun" closes Today, apart from the health cards, and the page opens with a plain disclaimer                     |
| Three names per child, the family's one shown                           | Families call a child by a home name; the birth-certificate name matters for papers and numerology, an English name for some families; both stay optional                                                |
| The migration test writes its old records in plain SQL                  | Code written against the current schema names columns an older database lacks; SQL of that time keeps the test valid for every later migration                                                           |
| Numerology texts in their own module                                    | Long descriptions in both languages read better as structured content than as hundreds of flat message keys; a test keeps the two languages in step                                                      |
| Milestones recorded, never assessed                                     | A page to remember a child's firsts; an expected age would turn it into a checklist and worry parents, and the app does not diagnose                                                                     |
| The child's page reads like a profile                                   | Parents asked for a Facebook-like page; the header, a "now" column and a timeline give that shape with the data the app already has, family only                                                         |
| No Co-Authored-By trailer in commits                                    | Maintainer's preference                                                                                                                                                                                  |
| Temperature levels from the usual paediatric thresholds                 | Fever from 38.0 °C and high fever from 39.0 °C are what parents are told; the app labels readings and advises when to ask a doctor, never diagnoses or works out a dose                                  |
| Health on Today only while it matters                                   | A card appears while an entry is going on or a reading is under 48 hours old, so Today stays calm the rest of the time                                                                                   |
| Readings in Vietnam time                                                | Forms take a date and a time in Vietnam (UTC+7, no daylight saving) and store a timestamp, so the log reads the same on every device                                                                     |
| The follow-up runs on dates, from the day of the dose to two days later | Doses are stored by day, without a time; two days after the dose covers the first 48 hours whatever time it was given                                                                                    |
| Owners from the environment, relatives from Settings                    | NOTCH_ALLOWED_EMAILS stays the root of trust: a database change can never make someone an owner. Relatives are invited by address and join on their first sign-in, with no separate invitation email     |
| Roles checked in every server action, controls hidden by role           | The server refuses a viewer's write whatever the page shows; hiding the controls (and a note on form pages) keeps the screens honest about what a viewer can do                                          |
| The service worker caches an offline page only                          | A child's health records stay off the device's caches; the offline page is fetched without a session, so even the cached copy names no one                                                               |
| A share link shows the child's page, never the health log               | People without an account see the name, age, milestones, latest measurement and doses; the health log, the birth date and time and the other names stay with the family, whatever the link's age         |
| Share links are stored as is, one per child                             | The family can copy the link again to send it to someone else; the token only opens what the database already holds. A new link replaces the old one, and an expired one stays listed to renew           |
| The demo runs on an in-memory database, not on production               | Production only migrates and never seeds; an in-memory PGlite per server instance shows the fictional child without an account, cannot touch a family's records and forgets everything with the instance |

## Follow-ups

- [x] When recording a dose, update the suggested next dose number when the dose number changes
- [ ] Licence of the bundled WHO tables: `anthro` code is GPL-3; the tables are WHO reference data. Confirm the attribution before a wider release
- [x] Growth chart on phones opens at the latest measurements; the y-axis labels need a swipe back (a copy of the axis stays at the left edge)
- [x] The restore summary counts health entries, temperatures and milestones, and names what an older backup lacks

## Issue log

- **2026-11-12:** PGlite creates only the last folder of its path, so `pglite:.data/pglite` failed on a fresh clone. `createDb` now creates the parent folders.
- **2026-11-12:** axe flagged the sideways-scrolling growth chart on phones (`scrollable-region-focusable`). The scroll container is now a focusable, labelled region.
- **2026-11-12:** the "next appointment" fieldset of the dose form overflowed its card: a fieldset's minimum width is its content. Fixed with `min-width: 0`.
- **2026-11-12:** Material Color Utilities does not export its `Variant` enum at runtime; the generator passes the tonal spot value directly.
- **2026-11-12:** the quick-add accessibility test failed now and then on the mobile project in CI with low contrast on every line of the dialog: axe scanned it while the overlay was fading in. Two fixes: the app had forced a 150ms transition on Sen UI, overriding its reduced-motion rule, so that duration now applies only without a reduced-motion preference; and the test opens the dialog with reduced motion and waits until it is painted fully opaque.
- **2026-11-13:** the first Vercel build stopped at `pnpm install` with `ERR_PNPM_UNSUPPORTED_ENGINE`: a new Vercel project defaults to Node 26, the repo asks for 24. Fixed in the project settings (Node.js Version 24.x).
- **2026-11-13:** Turborepo warned that the project's environment variables were missing from `turbo.json`. The build does not read them (the app reads them at run time); they are now listed as pass-through for the build task.
- **2026-11-13:** the first sign-in email from `onboarding@resend.dev` went to Gmail's Spam. Marked as not spam; a verified domain will help.
- **2026-11-13:** Dependabot proposed `@material/material-color-utilities` 0.4.0, whose ESM imports Node rejects. The 0.4.x range is now ignored.
- **2026-11-13:** on a preview, the sign-in link failed with `[query.token] Invalid input`: it pointed at the deployment's own address, Vercel's preview protection asked to sign in there again, and its redirect dropped the query string. Preview links now point at the branch URL, which people open and where the protection already let them in.
- **2026-11-19:** production had no vaccine catalog: deployments only migrate, and the catalog was loaded by the seed alone, so restoring a backup failed on the first product (`bcg`). `migrate` now loads the catalog too, and a test checks it.
- **2026-11-20:** moving between pages took one to three seconds. The functions ran in the default US region while the database is in Singapore, and each page made several queries in a row. Fixed by running the functions in `sin1`, adding a loading state, caching the session in a signed cookie and reading the family with its children in one query.
- **2026-11-20:** with the loading state, a backup picked right after the Settings page opened was ignored: the page streams, and the file input was there before its change handler. The input now stays disabled until the component has hydrated.
- **2026-11-24:** the PDF growth charts printed the −2 and −3 curve labels without their minus sign. Text inside react-pdf's `<Svg>` does not inherit the page's font and fell back to Helvetica, which has no U+2212. The chart text now sets Roboto, and a test renders a report and checks that Helvetica is not used.
