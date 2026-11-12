import { describe, expect, it } from "vitest";

import { nextDose, planDoses } from "./plan.js";
import type { Schedule } from "./types.js";

// Fixture only: fake vaccines, not a real schedule.
const SCHEDULE: Schedule = {
  vaccines: [
    { code: "alpha", name: "Alpha", program: "tcmr" },
    { code: "beta", name: "Beta", program: "service" },
  ],
  doses: [
    { vaccineCode: "alpha", doseNo: 1, recommendedAgeDays: 60, minAgeDays: 42 },
    { vaccineCode: "alpha", doseNo: 2, recommendedAgeDays: 90, minIntervalDays: 28 },
    { vaccineCode: "beta", doseNo: 1, recommendedAgeDays: 0, maxAgeDays: 30 },
  ],
};

const BIRTH = "2026-01-01";
const find = (states: ReturnType<typeof planDoses>, code: string, doseNo: number) =>
  states.find((s) => s.vaccineCode === code && s.doseNo === doseNo);

describe("planDoses", () => {
  it("returns states in schedule order", () => {
    const states = planDoses(SCHEDULE, BIRTH, [], "2026-01-01");
    expect(states.map((s) => `${s.vaccineCode}${String(s.doseNo)}`)).toEqual([
      "alpha1",
      "alpha2",
      "beta1",
    ]);
  });

  it("schedules a dose far in the future", () => {
    const alpha1 = find(planDoses(SCHEDULE, BIRTH, [], "2026-01-01"), "alpha", 1);
    expect(alpha1).toMatchObject({
      status: "scheduled",
      earliestOn: "2026-02-12",
      dueOn: "2026-03-02",
    });
  });

  it("marks a dose upcoming inside the window", () => {
    expect(find(planDoses(SCHEDULE, BIRTH, [], "2026-01-20"), "alpha", 1)?.status).toBe("upcoming");
  });

  it("marks a dose due from its earliest date until the grace period ends", () => {
    expect(find(planDoses(SCHEDULE, BIRTH, [], "2026-02-12"), "alpha", 1)?.status).toBe("due");
    expect(find(planDoses(SCHEDULE, BIRTH, [], "2026-04-01"), "alpha", 1)?.status).toBe("due");
  });

  it("marks a dose overdue after the grace period", () => {
    expect(find(planDoses(SCHEDULE, BIRTH, [], "2026-04-02"), "alpha", 1)?.status).toBe("overdue");
  });

  it("respects custom windows", () => {
    const states = planDoses(SCHEDULE, BIRTH, [], "2026-03-05", {
      overdueAfterDays: 0,
      upcomingWindowDays: 0,
    });
    expect(find(states, "alpha", 1)?.status).toBe("overdue");
  });

  it("waits for the previous dose", () => {
    expect(find(planDoses(SCHEDULE, BIRTH, [], "2026-06-01"), "alpha", 2)).toMatchObject({
      status: "waiting",
      dueOn: undefined,
      earliestOn: undefined,
    });
  });

  it("pushes the next dose back when the previous one was given late", () => {
    const states = planDoses(
      SCHEDULE,
      BIRTH,
      [{ vaccineCode: "alpha", doseNo: 1, givenOn: "2026-03-20" }],
      "2026-03-21",
    );
    expect(find(states, "alpha", 1)).toMatchObject({ status: "done", givenOn: "2026-03-20" });
    // Recommended at day 90 (2026-04-01), but 28 days after 2026-03-20 is 2026-04-17.
    expect(find(states, "alpha", 2)).toMatchObject({
      status: "upcoming",
      earliestOn: "2026-04-17",
      dueOn: "2026-04-17",
    });
  });

  it("marks a dose missed past its maximum age", () => {
    expect(find(planDoses(SCHEDULE, BIRTH, [], "2026-01-31"), "beta", 1)?.status).toBe("due");
    expect(find(planDoses(SCHEDULE, BIRTH, [], "2026-02-01"), "beta", 1)?.status).toBe("missed");
  });

  it("keeps a recorded dose done even if the previous one is missing", () => {
    const states = planDoses(
      SCHEDULE,
      BIRTH,
      [{ vaccineCode: "alpha", doseNo: 2, givenOn: "2026-04-01" }],
      "2026-05-01",
    );
    expect(find(states, "alpha", 2)?.status).toBe("done");
  });

  it("rejects invalid dates", () => {
    expect(() => planDoses(SCHEDULE, "2026-13-01", [], "2026-01-01")).toThrow(RangeError);
    expect(() => planDoses(SCHEDULE, "01/01/2026", [], "2026-01-01")).toThrow(RangeError);
  });
});

describe("nextDose", () => {
  it("picks the earliest-due actionable dose", () => {
    const states = planDoses(SCHEDULE, BIRTH, [], "2026-01-10");
    expect(nextDose(states)).toMatchObject({ vaccineCode: "beta", doseNo: 1 });
  });

  it("skips done, missed and waiting doses", () => {
    const states = planDoses(
      SCHEDULE,
      BIRTH,
      [{ vaccineCode: "alpha", doseNo: 1, givenOn: "2026-03-01" }],
      "2026-03-02",
    );
    expect(nextDose(states)).toMatchObject({ vaccineCode: "alpha", doseNo: 2 });
  });

  it("returns undefined when nothing is left", () => {
    const states = planDoses(
      SCHEDULE,
      BIRTH,
      [
        { vaccineCode: "alpha", doseNo: 1, givenOn: "2026-03-01" },
        { vaccineCode: "alpha", doseNo: 2, givenOn: "2026-04-01" },
      ],
      "2026-05-01",
    );
    expect(nextDose(states)).toBeUndefined();
  });
});
