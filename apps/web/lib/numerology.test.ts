import { describe, expect, it } from "vitest";

import {
  attitudeNumber,
  birthChart,
  combinedChart,
  birthdayNumber,
  expressionNumber,
  lifePathNumber,
  maturityNumber,
  personalityNumber,
  personalYearNumber,
  pinnacles,
  plainLetters,
  soulUrgeNumber,
} from "./numerology";

// Fixture names and dates only; not anyone's real record.
describe("lifePathNumber", () => {
  it("sums every digit of the birth date and reduces it", () => {
    expect(lifePathNumber("2025-05-20")).toEqual({
      value: 7,
      working: "2+0+2+5+0+5+2+0 = 16 → 1+6 = 7",
    });
  });

  it("keeps the master numbers 11, 22 and 33", () => {
    expect(lifePathNumber("2001-01-07").value).toBe(11);
    expect(lifePathNumber("2018-08-03").value).toBe(22);
    expect(lifePathNumber("1959-07-02").value).toBe(33);
    // 29 reduces to 11, which stays.
    expect(lifePathNumber("2008-09-19")).toEqual({
      value: 11,
      working: "2+0+0+8+0+9+1+9 = 29 → 2+9 = 11",
    });
  });
});

describe("birthdayNumber", () => {
  it("reduces the day of the month, keeping 11 and 22", () => {
    expect(birthdayNumber("2025-05-20")).toEqual({ value: 2, working: "2+0 = 2" });
    expect(birthdayNumber("2025-05-05")).toEqual({ value: 5, working: "5" });
    expect(birthdayNumber("2025-05-11").value).toBe(11);
    expect(birthdayNumber("2025-05-22").value).toBe(22);
    expect(birthdayNumber("2025-05-29").value).toBe(11);
  });
});

describe("expressionNumber", () => {
  it("drops Vietnamese marks and maps A–I to 1–9", () => {
    expect(plainLetters("Đặng Thị Mây")).toBe("DANGTHIMAY");
    expect(expressionNumber("Mây")).toEqual({ value: 3, working: "4+1+7 = 12 → 1+2 = 3" });
    expect(expressionNumber("Nguyễn Văn An")?.value).toBe(3);
    expect(expressionNumber("Đức")?.value).toBe(1);
  });

  it("has nothing to say about a name without letters", () => {
    expect(expressionNumber("123 !")).toBeUndefined();
  });
});

describe("name numbers from vowels and consonants", () => {
  it("splits the letters, counting Y as a vowel", () => {
    // MAY: vowels A(1) Y(7) = 8; consonant M(4).
    expect(soulUrgeNumber("Mây")).toEqual({ value: 8, working: "1+7 = 8" });
    expect(personalityNumber("Mây")).toEqual({ value: 4, working: "4 = 4" });
    expect(soulUrgeNumber("Bcd")).toBeUndefined();
    expect(personalityNumber("Aye")).toBeUndefined();
  });
});

describe("attitude, maturity and personal year", () => {
  it("adds the day and month, the life path and expression, and the year", () => {
    expect(attitudeNumber("2025-05-20")).toEqual({ value: 7, working: "0+5+2+0 = 7" });
    const lifePath = lifePathNumber("2025-05-20");
    const expression = { value: 3, working: "" };
    expect(maturityNumber(lifePath, expression)).toEqual({
      value: 1,
      working: "7+3 = 10 → 1+0 = 1",
    });
    expect(maturityNumber({ value: 4, working: "" }, { value: 7, working: "" })).toEqual({
      value: 11,
      working: "4+7 = 11",
    });
    // 0+5+2+0 + 2+0+2+6 = 17 → 8.
    expect(personalYearNumber("2025-05-20", 2026).value).toBe(8);
  });
});

describe("birthChart", () => {
  it("counts the digits and names full and empty lines", () => {
    // 2025-05-20: 2 ×3, 5 ×2; zeros left out.
    const chart = birthChart("2025-05-20");
    expect(chart.counts[2]).toBe(3);
    expect(chart.counts[5]).toBe(2);
    expect(chart.missing).toEqual([1, 3, 4, 6, 7, 8, 9]);
    expect(chart.full).toEqual([]);
    expect(chart.empty).toEqual(["action", "mind", "practical"]);
    // 1987-06-23: 1 2 3 6 7 8 9 → plan, action, mind full; nothing of 4 5 → no empty line.
    const other = birthChart("1987-06-23");
    expect(other.full).toEqual(["plan", "action", "mind"]);
    expect(other.empty).toEqual([]);
  });
});

describe("pinnacles", () => {
  it("gives four periods ending at 36 minus the life path", () => {
    // 2025-05-20: life path 7, so the first ends at 29. Month 5, day 2, year 9.
    expect(pinnacles("2025-05-20")).toEqual([
      { reading: { value: 7, working: "5+2 = 7" }, fromAge: 0, toAge: 29 },
      { reading: { value: 11, working: "2+9 = 11" }, fromAge: 30, toAge: 38 },
      { reading: { value: 9, working: "7+11 = 18 → 1+8 = 9" }, fromAge: 39, toAge: 47 },
      { reading: { value: 5, working: "5+9 = 14 → 1+4 = 5" }, fromAge: 48, toAge: null },
    ]);
  });
});

describe("combinedChart", () => {
  it("adds the letters of the name to the digits of the date", () => {
    // 2025-05-20 gives 2 ×3 and 5 ×2; "Mây" adds M=4, A=1, Y=7.
    const chart = combinedChart("2025-05-20", "Mây");
    expect(chart.counts[1]).toBe(1);
    expect(chart.counts[4]).toBe(1);
    expect(chart.counts[7]).toBe(1);
    expect(chart.counts[2]).toBe(3);
    // 1-4-7 is now full; only 3-6-9 stays empty.
    expect(chart.full).toEqual(["practical"]);
    expect(chart.empty).toEqual(["mind"]);
    expect(chart.missing).toEqual([3, 6, 8, 9]);
  });
});
