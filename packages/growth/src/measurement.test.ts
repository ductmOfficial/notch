import { describe, expect, it } from "vitest";

import { adjustLengthHeight, ageInDays, bmi } from "./measurement.js";

describe("ageInDays", () => {
  it("counts calendar days, including leap days", () => {
    expect(ageInDays("2024-02-28", "2024-03-01")).toBe(2);
    expect(ageInDays("2025-06-01", "2026-06-01")).toBe(365);
    expect(ageInDays("2025-06-01", "2025-06-01")).toBe(0);
  });

  it("rejects malformed and impossible dates", () => {
    expect(() => ageInDays("2025-6-1", "2025-06-02")).toThrow(RangeError);
    expect(() => ageInDays("2025-02-30", "2025-03-02")).toThrow(RangeError);
  });
});

describe("adjustLengthHeight", () => {
  it("adds 0.7 cm under 731 days when measured standing", () => {
    expect(adjustLengthHeight(80, 500, "standing")).toBeCloseTo(80.7, 10);
    expect(adjustLengthHeight(80, 500, "lying")).toBe(80);
  });

  it("subtracts 0.7 cm from 731 days when measured lying", () => {
    expect(adjustLengthHeight(90, 731, "lying")).toBeCloseTo(89.3, 10);
    expect(adjustLengthHeight(90, 731, "standing")).toBe(90);
  });
});

describe("bmi", () => {
  it("divides kg by metres squared", () => {
    expect(bmi(10, 100)).toBe(10);
    expect(bmi(9.6, 75.7)).toBeCloseTo(16.75, 2);
  });
});
