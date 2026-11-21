import { describe, expect, it } from "vitest";

import { ARROWS, PLANES } from "./numerology";
import {
  ARROW_MEANINGS,
  CELL_MEANINGS,
  CENTER_FIVE,
  MEANINGS,
  MISSING_MEANINGS,
  NUMBERS,
  PLANE_MEANINGS,
  YEAR_THEMES,
} from "./numerology-content";

describe("numerology content", () => {
  it.each(["vi", "en"] as const)("covers every number and line in %s", (locale) => {
    for (const n of NUMBERS) {
      const m = MEANINGS[locale][n];
      expect(m?.title, String(n)).toBeTruthy();
      expect(m?.strengths.length, String(n)).toBeGreaterThanOrEqual(2);
      expect(m?.nurture.length, String(n)).toBeGreaterThanOrEqual(1);
      expect(m?.parents.length, String(n)).toBeGreaterThanOrEqual(1);
      expect(YEAR_THEMES[locale][n], String(n)).toBeTruthy();
    }
    for (const key of Object.keys(ARROWS)) {
      expect(ARROW_MEANINGS[locale][key as keyof typeof ARROWS].name).toBeTruthy();
    }
  });

  it("keeps Vietnamese and English in step", () => {
    for (const n of NUMBERS) {
      const vi = MEANINGS.vi[n];
      const en = MEANINGS.en[n];
      expect(en?.strengths.length, String(n)).toBe(vi?.strengths.length);
      expect(en?.nurture.length, String(n)).toBe(vi?.nurture.length);
      expect(en?.parents.length, String(n)).toBe(vi?.parents.length);
    }
  });
});

describe("chart reading content", () => {
  it.each(["vi", "en"] as const)(
    "covers every digit, count, plane and the centre in %s",
    (locale) => {
      for (let d = 1; d <= 9; d++) {
        for (const n of [1, 2, 3, 4] as const)
          expect(CELL_MEANINGS[locale][d]?.[n], `${String(d)}×${String(n)}`).toBeTruthy();
        expect(MISSING_MEANINGS[locale][d], String(d)).toBeTruthy();
      }
      for (const key of Object.keys(PLANES)) {
        const plane = PLANE_MEANINGS[locale][key as keyof typeof PLANES];
        expect(plane.name && plane.strong, key).toBeTruthy();
      }
      expect(CENTER_FIVE[locale].present && CENTER_FIVE[locale].absent).toBeTruthy();
    },
  );
});
