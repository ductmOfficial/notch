# Progress

> Last updated: 2026-11-12
>
> Legend: ✅ done · 🔄 in progress · ⬜ not started

Notch tracks a child's growth, vaccinations and health. This repo was created from [`ductran-starter`](https://github.com/ductmOfficial/ductran-starter). This log records each step, the decisions behind it and the issues met along the way.

## Phases

| Phase | Scope                                                                       | Status |
| ----- | --------------------------------------------------------------------------- | ------ |
| P0    | Foundation: growth and vaccines engines, database, app skeleton             | 🔄     |
| P1    | Today, Growth and Vaccinations screens, forms, `.ics` calendar, design, E2E | 🔄     |
| P2    | Health log, post-vaccination follow-up, PDF, family sharing                 | ⬜     |
| P3    | PWA, demo mode, deployment                                                  | ⬜     |

## Steps

| #   | Step                                                                 | Branch                 | Status |
| --- | -------------------------------------------------------------------- | ---------------------- | ------ |
| 1   | Repository from the `ductran-starter` template                       | `main`                 | ✅     |
| 2   | Rename to `notch`, drop the sample package, PostgreSQL on port 5433  | `chore/setup`          | ✅     |
| 3   | `@notch/growth`: WHO LMS z-scores and percentiles, generated data    | `feat/growth`          | ✅     |
| 4   | `@notch/vaccines`: catalog, appointments, schedule engine            | `feat/vaccines`        | ✅     |
| 5   | `@notch/db`: schema, migrations, queries, mutations, seed, demo data | `feat/db`              | ✅     |
| 6   | Today, Growth and Vaccinations screens                               | `feat/web`             | ✅     |
| 7   | Forms for measurements, doses and appointments; `.ics` download      | `feat/forms`           | ✅     |
| 8   | Material Design 3 with a lotus palette, on Sen UI                    | `feat/theme`           | ✅     |
| 9   | Playwright and axe tests, `Browser` job in CI                        | `test/e2e`             | ✅     |
| 10  | README and this progress log                                         | `docs/readme`          | ✅     |
| 11  | Settings page with a light, dark or system theme                     | `feat/theme-setting`   | ✅     |
| 12  | Vietnamese and English, chosen in Settings                           | `feat/i18n`            | ✅     |
| 13  | Lotus watermark behind the content                                   | `feat/lotus-backdrop`  | ✅     |
| 14  | Add button flat in the navigation rail                               | `fix/rail-fab-flat`    | ✅     |
| 15  | Lotus mark next to the name, on empty states, as the favicon         | `feat/lotus-mark`      | ✅     |
| 16  | Lotus drawings on the summary cards                                  | `feat/card-lotus`      | ✅     |
| 17  | Daylily (huyên thảo) palette and drawings, chosen in Settings        | `feat/daylily-palette` | ✅     |
| 18  | Cloud (mây) palette and drawings                                     | `feat/cloud-palette`   | ✅     |
| 19  | Quiet chips for given doses; status colors harmonized                | `feat/quiet-done`      | ✅     |

Each step is a pull request with green checks (`Browser` from step 9), merged with rebase.

### Still open in P0 and P1

- [ ] Sign-in (Better Auth, magic link). **Required before any deployment**: the forms have no access control.
- [ ] Vercel and Neon preview deploys, then the `.ics` subscription URL
- [ ] Vietnamese EPI (TCMR) schedule data, generated from an official source

## Decisions

| Decision                                                          | Reason                                                                                                                                              |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| WHO data by day of age                                            | `anthro` publishes LMS values for every day from 0 to 1826, so no interpolation between monthly rows is needed                                      |
| Restricted extrapolation beyond ±3 SD for weight-based indicators | As WHO specifies; length/height and head circumference use the plain LMS formula                                                                    |
| Vaccine data is not typed by hand                                 | The engine ships with fixture schedules; the real schedule comes from a generator once an official source is reachable                              |
| Appointments over schedules                                       | Real records show the clinic books every next dose, so the app reminds from appointments; `planDoses` stays for suggestions                         |
| Doses per product, shown per disease                              | One product can cover several diseases (Infanrix Hexa covers six)                                                                                   |
| Approximate values flagged per value                              | A record can have an approximate weight and an exact length                                                                                         |
| PGlite next to PostgreSQL                                         | The same Drizzle code runs on both; tests, E2E and Docker-free local runs use PGlite                                                                |
| Seed is for the first load only                                   | It refuses to overwrite a child that already has records unless `--replace` is passed, so data entered in the app is kept                           |
| A fictional demo child in the repository                          | E2E and demos need data; real records stay outside the repository                                                                                   |
| Calendar titles stay generic ("Lịch tiêm cho bé")                 | Calendars sync to other services and show on lock screens                                                                                           |
| Server-rendered SVG chart                                         | No chart library and no client JavaScript; the table repeats the data                                                                               |
| Material Design 3                                                 | A widely known system with published guidance for color, type, shape and layout; familiar to phone users                                            |
| Lotus palette generated with Material Color Utilities             | Colors come from four seed colors, light and dark, with contrast built in; a unit test checks AA for every pairing                                  |
| Sen UI tokens mapped to M3 color roles                            | Sen UI components follow the scheme without forking them; the same token approach restyles the portfolio                                            |
| Forms moved to Sen UI with the design system                      | One switch for every control; the first forms used native inputs behind one module so the swap touched only that module                             |
| Deleting asks in an `alertdialog`                                 | A single tap never deletes; Cancel keeps focus where it was                                                                                         |
| `@material/material-color-utilities` 0.3.x                        | 0.4.0 imports its own files without extensions, which Node's ESM loader rejects                                                                     |
| E2E on a fresh PGlite database, flows on desktop only             | Tests are independent of any local data; flows change data, so they run once while accessibility runs on desktop and mobile                         |
| Browser checks with the runner's Chrome                           | No browser download and no apt packages in CI; Playwright's Chromium stays the fallback                                                             |
| Theme kept in a cookie and applied on the server                  | The page never flashes the wrong theme on load; "System" removes the cookie and follows the device                                                  |
| Language from a cookie, then the browser; no locale in URLs       | The app is private and not indexed, so URLs stay short; Vietnamese is the fallback                                                                  |
| Flat dictionaries, Vietnamese as the reference                    | TypeScript rejects unknown keys; a unit test keeps English on the same keys and placeholders                                                        |
| Lotus drawn in SVG, not a photo                                   | It takes its colors from the scheme, so it follows light and dark, weighs a few hundred bytes and needs no image license                            |
| The lotus mark stays off data cards and navigation                | Those icons tell what an item is (weight, vaccine, settings); the lotus is the brand, shown where nothing else needs saying                         |
| Palettes switch with a `data-palette` attribute and CSS           | Every scheme is in `theme.css` and every drawing is rendered for every palette, so the page repaints at once; the cookie only serves the next visit |
| Daylily as a second palette, lotus stays the default              | In East Asian tradition the daylily stands for the mother; parents can pick the flower they prefer                                                  |
| Cloud palette with its own "done" green                           | Sky blue, sunset peach and sun yellow carry the theme; "done" stays green so its meaning does not change with the palette                           |
| Given doses as outlined chips with a green check                  | A given dose is the normal state; strong color is kept for what needs action (overdue, upcoming), so a long list does not turn the page green       |
| Status colors harmonized toward the primary, at most 8°           | As M3 does for custom colors; at the usual 15° the lotus's "done" green turned olive                                                                |
| No Co-Authored-By trailer in commits                              | Maintainer's preference                                                                                                                             |

## Follow-ups

- [ ] When recording a dose, update the suggested next dose number when the dose number changes
- [ ] Licence of the bundled WHO tables: `anthro` code is GPL-3; the tables are WHO reference data. Confirm the attribution before a wider release
- [ ] Growth chart on phones opens at the latest measurements; the y-axis labels need a swipe back

## Issue log

- **2026-11-12:** PGlite creates only the last folder of its path, so `pglite:.data/pglite` failed on a fresh clone. `createDb` now creates the parent folders.
- **2026-11-12:** axe flagged the sideways-scrolling growth chart on phones (`scrollable-region-focusable`). The scroll container is now a focusable, labelled region.
- **2026-11-12:** the "next appointment" fieldset of the dose form overflowed its card: a fieldset's minimum width is its content. Fixed with `min-width: 0`.
- **2026-11-12:** Material Color Utilities does not export its `Variant` enum at runtime; the generator passes the tonal spot value directly.
- **2026-11-12:** the quick-add accessibility test failed now and then on the mobile project in CI with low contrast on every line of the dialog: axe scanned it while the overlay was fading in. Two fixes: the app had forced a 150ms transition on Sen UI, overriding its reduced-motion rule, so that duration now applies only without a reduced-motion preference; and the test opens the dialog with reduced motion and waits until it is painted fully opaque.
