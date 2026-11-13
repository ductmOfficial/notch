import { describe, expect, it } from "vitest";

import { DISEASE_CODES, type DiseaseCode } from "./catalog.js";
import { TCMR_DOSES, TCMR_SOURCE, tcmrOverview } from "./tcmr.js";

// Expected values read from Article 1 of Thông tư 52/2025/TT-BYT, row by row.
const EXPECTED: Record<string, readonly number[]> = {
  "hepatitis-b": [0, 2, 3, 4],
  tuberculosis: [0],
  diphtheria: [2, 3, 4, 18, 84],
  pertussis: [2, 3, 4, 18],
  tetanus: [2, 3, 4, 18, 84],
  polio: [2, 3, 4, 5, 9],
  hib: [2, 3, 4],
  measles: [9, 18],
  rubella: [18],
  "japanese-encephalitis": [12, 12, 24],
  rotavirus: [2, 3],
  pneumococcal: [2, 4],
};

describe("TCMR schedule", () => {
  it("follows the circular's ages for every disease of the programme", () => {
    const byDisease: Record<string, number[]> = {};
    for (const d of TCMR_DOSES) (byDisease[d.disease] ??= []).push(d.ageMonths);
    expect(byDisease).toEqual(EXPECTED);
    expect(TCMR_SOURCE).toMatchObject({
      document: "Thông tư 52/2025/TT-BYT",
      effectiveOn: "2026-02-15",
    });
  });

  it("numbers doses 1..n per disease, uses known diseases and has both languages", () => {
    const counts = new Map<string, number>();
    for (const d of TCMR_DOSES) {
      expect(DISEASE_CODES).toContain(d.disease);
      const next = (counts.get(d.disease) ?? 0) + 1;
      expect(d.doseNo).toBe(next);
      counts.set(d.disease, next);
      expect(d.vaccine.vi).not.toBe("");
      expect(d.vaccine.en).not.toBe("");
      if (d.timing) expect(d.timing.en).not.toBe("");
    }
    expect(TCMR_DOSES).toHaveLength(37);
  });

  it("groups by age and marks what is recorded and which ages are reached", () => {
    const doses = new Map<DiseaseCode, number>([
      ["hepatitis-b", 4],
      ["polio", 3],
    ]);
    const groups = tcmrOverview(doses, 4);
    expect(groups.map((g) => g.ageMonths)).toEqual([0, 2, 3, 4, 5, 9, 12, 18, 24, 84]);
    expect(groups.filter((g) => g.reached).map((g) => g.ageMonths)).toEqual([0, 2, 3, 4]);
    const five = groups.find((g) => g.ageMonths === 5);
    expect(five?.rows.map((r) => [r.disease, r.doseNo, r.recorded])).toEqual([["polio", 4, false]]);
    const two = groups.find((g) => g.ageMonths === 2)?.rows ?? [];
    expect(two.find((r) => r.disease === "hepatitis-b")?.recorded).toBe(true);
    expect(two.find((r) => r.disease === "polio")?.recorded).toBe(true);
    expect(two.find((r) => r.disease === "hib")?.recorded).toBe(false);
  });
});
