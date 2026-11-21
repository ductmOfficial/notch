import { describe, expect, it } from "vitest";

import { ARROWS } from "./numerology";
import { ARROW_MEANINGS, MEANINGS, NUMBERS, YEAR_THEMES } from "./numerology-content";

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
