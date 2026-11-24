import { describe, expect, it } from "vitest";

import { missingParts, summarizeBackup } from "./backup-summary";

describe("summarizeBackup", () => {
  it("counts every kind of record across children", () => {
    const summary = summarizeBackup({
      format: "notch-backup",
      version: 4,
      exportedAt: "2026-11-20T03:00:00.000Z",
      children: [
        {
          measurements: [{}, {}],
          vaccinations: [{}],
          appointments: [],
          healthEntries: [{}],
          temperatures: [{}, {}, {}],
          milestones: [{}],
        },
        { measurements: [{}], vaccinations: [], appointments: [{}] },
      ],
    });
    expect(summary).toEqual({
      exportedAt: "2026-11-20T03:00:00.000Z",
      version: 4,
      children: 2,
      measurements: 3,
      vaccinations: 1,
      appointments: 1,
      healthEntries: 1,
      temperatures: 3,
      milestones: 1,
    });
  });

  it("reads a file without a version or a date as version 1", () => {
    const summary = summarizeBackup({ format: "notch-backup", children: [] });
    expect(summary.version).toBe(1);
    expect(summary.exportedAt).toBe("");
  });

  it("rejects anything else", () => {
    expect(() => summarizeBackup({ format: "other", children: [] })).toThrow("format");
    expect(() => summarizeBackup({ format: "notch-backup" })).toThrow("format");
  });
});

describe("missingParts", () => {
  it("names what each older version lacks", () => {
    expect(missingParts(1)).toEqual(["health", "names", "milestones"]);
    expect(missingParts(2)).toEqual(["names", "milestones"]);
    expect(missingParts(3)).toEqual(["milestones"]);
    expect(missingParts(4)).toEqual([]);
  });
});
