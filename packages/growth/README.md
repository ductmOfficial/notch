# @notch/growth

WHO Child Growth Standards (0–5 years) for TypeScript: z-scores, percentiles and reference curves. No runtime dependencies, no React, so it runs in Node, the browser and React Native.

```ts
import { ageInDays, curveValue, percentile, zScore } from "@notch/growth";

const age = ageInDays("2025-06-01", "2026-06-01"); // 365
const z = zScore("weight-for-age", "female", age, 9.2); // ≈ 0.25
const p = z === undefined ? undefined : percentile(z); // ≈ 60
const minus2 = curveValue("weight-for-age", "female", age, -2); // ≈ 7.0 kg
```

| Indicator                    | Unit  | Notes                                                          |
| ---------------------------- | ----- | -------------------------------------------------------------- |
| `weight-for-age`             | kg    | Restricted extrapolation beyond ±3 SD                          |
| `length-height-for-age`      | cm    | Length before 731 days, height after; see `adjustLengthHeight` |
| `head-circumference-for-age` | cm    |                                                                |
| `bmi-for-age`                | kg/m² | Restricted extrapolation beyond ±3 SD                          |

## How it works

- **LMS method.** `z = ((value / M)^L − 1) / (L · S)`, with L, M and S looked up for the child's sex and age in whole days (0–1826).
- **Restricted extrapolation.** For weight-based indicators, WHO replaces the LMS tail beyond ±3 SD with a linear extension based on the distance between the 2 and 3 SD curves.
- **Length vs height.** WHO measures children lying down before 731 days and standing after. `adjustLengthHeight` adds or subtracts 0.7 cm when the position does not match the age.
- **Percentiles** come from the standard normal CDF.

## Reading a z-score

`assess(indicator, z)` names a z-score as WHO's [Interpreting growth indicators](https://www.who.int/publications/i/item/9789241595070) does (Training Course on Child Growth Assessment, 2008), with a level for what it asks of the parents:

| Indicator          | below −3             | −3 to −2    | −2 to +1 | +1 to +2           | +2 to +3   | above +3  |
| ------------------ | -------------------- | ----------- | -------- | ------------------ | ---------- | --------- |
| Length/height      | severely stunted     | stunted     | normal   | normal             | normal     | very tall |
| Weight             | severely underweight | underweight | normal   | check BMI          | check BMI  | check BMI |
| BMI                | severely wasted      | wasted      | normal   | risk of overweight | overweight | obese     |
| Head circumference | small                | small       | normal   | normal             | large      | large     |

"Below −2" means z < −2 and "above +2" means z > 2, so −2 and +2 read as normal. Problems WHO names are level `doctor`; "very tall", "check BMI" and "risk of overweight" are `watch`. Head circumference has no named problem in that table; outside ±2 SD it is flagged for a doctor.

```ts
import { assess, normalRange, trend } from "@notch/growth";

assess("bmi-for-age", 1.4); // { status: "risk-of-overweight", level: "watch" }
normalRange("weight-for-age", "female", 549); // { low: 8.1, median: 10.2, high: 11.6 } (kg)
trend(0.8, -0.4); // "falling": a change of 1 SD or more crosses a line of the chart
```

The package says what the numbers are; it does not diagnose. The app adds advice that only points to a doctor.

## Data

`src/data/*.ts` is generated, not written by hand:

```bash
NODE_USE_ENV_PROXY=1 pnpm --filter @notch/growth generate   # the env var only matters behind a proxy
```

The script downloads the LMS tables from the WHO [`anthro`](https://github.com/WorldHealthOrganization/anthro) repository (`data-raw/growthstandards/`), pinned to commit `b776d8a`, checks that every sex has one row per day from 0 to 1826, and writes flat `[L, M, S]` arrays. The tables are © World Health Organization.

Tests check the curves against values in the published WHO tables, round-trip every indicator, and cover the extrapolation rules. Coverage threshold: 90%.
