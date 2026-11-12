import { describe, expect, it } from "vitest";

import type { Schedule } from "./types.js";
import { validateSchedule } from "./validate.js";

const vaccines: Schedule["vaccines"] = [{ code: "alpha", name: "Alpha", program: "tcmr" }];

describe("validateSchedule", () => {
  it("accepts a consistent schedule", () => {
    expect(() => {
      validateSchedule({
        vaccines,
        doses: [
          { vaccineCode: "alpha", doseNo: 2, recommendedAgeDays: 90, minIntervalDays: 28 },
          {
            vaccineCode: "alpha",
            doseNo: 1,
            recommendedAgeDays: 60,
            minAgeDays: 42,
            maxAgeDays: 365,
          },
        ],
      });
    }).not.toThrow();
  });

  it.each<[string, Schedule]>([
    ["Duplicate vaccine code", { vaccines: [...vaccines, ...vaccines], doses: [] }],
    [
      "unknown vaccine",
      { vaccines, doses: [{ vaccineCode: "beta", doseNo: 1, recommendedAgeDays: 0 }] },
    ],
    [
      "minimum age after recommended age",
      {
        vaccines,
        doses: [{ vaccineCode: "alpha", doseNo: 1, recommendedAgeDays: 10, minAgeDays: 20 }],
      },
    ],
    [
      "minimum age after recommended age",
      {
        vaccines,
        doses: [{ vaccineCode: "alpha", doseNo: 1, recommendedAgeDays: 10, minAgeDays: -1 }],
      },
    ],
    [
      "maximum age before recommended age",
      {
        vaccines,
        doses: [{ vaccineCode: "alpha", doseNo: 1, recommendedAgeDays: 10, maxAgeDays: 5 }],
      },
    ],
    [
      "negative interval",
      {
        vaccines,
        doses: [{ vaccineCode: "alpha", doseNo: 1, recommendedAgeDays: 10, minIntervalDays: -1 }],
      },
    ],
    [
      "dose numbers must be 1..1",
      { vaccines, doses: [{ vaccineCode: "alpha", doseNo: 2, recommendedAgeDays: 10 }] },
    ],
  ])("rejects: %s", (message, schedule) => {
    expect(() => {
      validateSchedule(schedule);
    }).toThrow(message);
  });
});
