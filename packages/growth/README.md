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

## Data

`src/data/*.ts` is generated, not written by hand:

```bash
NODE_USE_ENV_PROXY=1 pnpm --filter @notch/growth generate   # the env var only matters behind a proxy
```

The script downloads the LMS tables from the WHO [`anthro`](https://github.com/WorldHealthOrganization/anthro) repository (`data-raw/growthstandards/`), pinned to commit `b776d8a`, checks that every sex has one row per day from 0 to 1826, and writes flat `[L, M, S]` arrays. The tables are © World Health Organization.

Tests check the curves against values in the published WHO tables, round-trip every indicator, and cover the extrapolation rules. Coverage threshold: 90%.
