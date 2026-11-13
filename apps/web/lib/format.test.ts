import { describe, expect, it } from "vitest";

import {
  ageInMonths,
  formatAge,
  formatDate,
  formatNumber,
  formatZ,
  todayInVietnam,
  zBand,
} from "./format";

describe("formatAge", () => {
  it.each([
    ["2030-01-10", "2030-01-15", "5 ngày"],
    ["2030-01-31", "2030-03-01", "1 tháng 1 ngày"],
    ["2030-03-16", "2030-11-09", "7 tháng 24 ngày"],
    ["2030-03-16", "2030-05-16", "2 tháng"],
    ["2030-03-16", "2031-03-16", "1 tuổi"],
    ["2030-03-16", "2031-05-20", "1 tuổi 2 tháng"],
    ["2030-03-16", "2030-03-01", "chưa sinh"],
    // A 29 February birthday falls on 28 February in common years.
    ["2032-02-29", "2033-02-28", "1 tuổi"],
    ["2030-01-15", "2030-02-10", "26 ngày"],
  ])("%s → %s: %s", (birth, on, expected) => {
    expect(formatAge(birth, on)).toBe(expected);
  });

  it("rejects malformed dates", () => {
    expect(() => formatAge("16/03/2030", "2030-11-09")).toThrow(RangeError);
  });
});

describe("formatting", () => {
  it("formats dates, numbers and z-scores the Vietnamese way", () => {
    expect(formatDate("2030-11-09")).toBe("09/11/2030");
    expect(formatNumber(8.6, 2)).toBe("8,60");
    expect(formatNumber(1234.5, 1)).toBe("1.234,5");
    expect(formatZ(0.7)).toBe("+0,70");
    expect(formatZ(-1.234)).toBe("−1,23");
  });

  it.each([
    [-3.5, "dưới −3 SD"],
    [-2.5, "từ −3 đến −2 SD"],
    [0, "trong khoảng ±2 SD"],
    [2.5, "từ +2 đến +3 SD"],
    [3.5, "trên +3 SD"],
  ])("z = %f is %s", (z, band) => {
    expect(zBand(z)).toBe(band);
  });
});

describe("English", () => {
  it("formats ages, dates and numbers", () => {
    expect(formatAge("2030-03-16", "2031-05-20", "en")).toBe("1 year 2 months");
    expect(formatAge("2030-01-31", "2030-03-01", "en")).toBe("1 month 1 day");
    expect(formatAge("2030-03-16", "2032-03-16", "en")).toBe("2 years");
    expect(formatAge("2030-03-16", "2030-03-01", "en")).toBe("not born yet");
    expect(formatDate("2030-11-09", "en")).toBe("9 Nov 2030");
    expect(formatNumber(1234.5, 1, "en")).toBe("1,234.5");
    expect(formatZ(-1.234, "en")).toBe("−1.23");
    expect(zBand(0, "en")).toBe("within ±2 SD");
  });
});

describe("todayInVietnam", () => {
  it("uses the Vietnam calendar day", () => {
    expect(todayInVietnam(new Date("2030-11-08T18:30:00Z"))).toBe("2030-11-09");
    expect(todayInVietnam(new Date("2030-11-08T16:00:00Z"))).toBe("2030-11-08");
  });
});

describe("ageInMonths", () => {
  it("counts whole months, clamping to the end of short months", () => {
    expect(ageInMonths("2030-01-31", "2030-02-27")).toBe(0);
    expect(ageInMonths("2030-01-31", "2030-02-28")).toBe(1);
    expect(ageInMonths("2030-01-15", "2031-07-14")).toBe(17);
    expect(ageInMonths("2030-01-15", "2031-07-15")).toBe(18);
    expect(ageInMonths("2030-01-15", "2029-12-01")).toBe(0);
  });
});
