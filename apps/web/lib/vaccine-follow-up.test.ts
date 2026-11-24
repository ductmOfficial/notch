import type { Temperature, Vaccination } from "@notch/db";
import { describe, expect, it } from "vitest";

import { vaccineFollowUp } from "./vaccine-follow-up";

const dose = (id: string, givenOn: string, productCode = "infanrix-hexa"): Vaccination => ({
  id,
  childId: "c",
  productCode,
  doseNo: 1,
  givenOn,
  place: null,
  lot: null,
  note: null,
  createdAt: new Date(`${givenOn}T00:00:00Z`),
});

const reading = (at: string, tenthsC = 375): Temperature => ({
  id: at,
  childId: "c",
  measuredAt: new Date(at),
  tenthsC,
  healthEntryId: null,
  note: null,
  createdAt: new Date(at),
});

describe("vaccineFollowUp", () => {
  const doses = [
    dose("1", "2026-09-01"),
    dose("2", "2026-11-20"),
    dose("3", "2026-11-20", "rotateq"),
  ];
  const readings = [
    reading("2026-11-19T05:00:00Z"),
    reading("2026-11-20T10:00:00Z", 381),
    reading("2026-11-21T01:00:00Z", 372),
  ];

  it("follows the latest doses from their day to two days later", () => {
    const followUp = vaccineFollowUp(doses, readings, "2026-11-21");
    expect(followUp?.givenOn).toBe("2026-11-20");
    expect(followUp?.day).toBe(1);
    expect(followUp?.doses.map((d) => d.id)).toEqual(["2", "3"]);
    // Readings since the day of the doses, newest first.
    expect(followUp?.readings.map((r) => r.tenthsC)).toEqual([372, 381]);
    expect(vaccineFollowUp(doses, readings, "2026-11-20")?.day).toBe(0);
    expect(vaccineFollowUp(doses, readings, "2026-11-22")?.day).toBe(2);
  });

  it("ends after two days, and needs a dose", () => {
    expect(vaccineFollowUp(doses, readings, "2026-11-23")).toBeUndefined();
    expect(vaccineFollowUp([], readings, "2026-11-21")).toBeUndefined();
    // A dose dated later than today (a typing slip) starts nothing.
    expect(vaccineFollowUp([dose("4", "2026-12-01")], [], "2026-11-21")).toBeUndefined();
  });
});
