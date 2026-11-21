import { describe, expect, it } from "vitest";

import { birthdayNumber, expressionNumber, lifePathNumber, plainLetters } from "./numerology";

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
