import type { HealthEntry, Temperature } from "@notch/db";
import { describe, expect, it } from "vitest";

import {
  entryPeriod,
  formatDateTime,
  formatTemperature,
  fromVietnam,
  healthKindLabel,
  healthOverview,
  isOngoing,
  readingsByDay,
  temperatureAdvice,
  temperatureLevel,
  temperatureLevelLabel,
  vietnamDateTime,
} from "./health-view";

const entry = (over: Partial<HealthEntry>): HealthEntry => ({
  id: "e1",
  childId: "c1",
  kind: "illness",
  title: "Sốt",
  startedOn: "2026-11-10",
  endedOn: null,
  note: null,
  createdAt: new Date("2026-11-10T00:00:00Z"),
  ...over,
});

const reading = (at: string, tenthsC: number): Temperature => ({
  id: at,
  childId: "c1",
  measuredAt: new Date(at),
  tenthsC,
  healthEntryId: null,
  note: null,
  createdAt: new Date(at),
});

describe("temperatures", () => {
  it("places a reading against the usual thresholds", () => {
    expect([355, 360, 374, 375, 379, 380, 389, 390].map(temperatureLevel)).toEqual([
      "low",
      "normal",
      "normal",
      "warm",
      "warm",
      "fever",
      "fever",
      "high",
    ]);
    expect(temperatureLevelLabel("fever", "vi")).toBe("Sốt");
    expect(temperatureLevelLabel("high", "en")).toBe("High fever");
  });

  it("formats in the page's language", () => {
    expect(formatTemperature(385)).toBe("38,5 °C");
    expect(formatTemperature(370, "en")).toBe("37.0 °C");
  });

  it("advises without diagnosing, and sooner for a young baby", () => {
    // Born 2026-10-01: under three months on 2026-11-24.
    expect(temperatureAdvice(381, "2026-10-01", "2026-11-24")).toMatch(/dưới 3 tháng/);
    expect(temperatureAdvice(381, "2025-05-20", "2026-11-24")).toMatch(/Theo dõi/);
    expect(temperatureAdvice(395, "2025-05-20", "2026-11-24", "en")).toMatch(/doctor/);
    expect(temperatureAdvice(355, "2025-05-20", "2026-11-24")).toMatch(/Đo lại/);
    expect(temperatureAdvice(370, "2025-05-20", "2026-11-24")).toBeNull();
    expect(temperatureAdvice(377, "2025-05-20", "2026-11-24")).toBeNull();
  });
});

describe("Vietnam time", () => {
  it("shows and reads moments in UTC+7", () => {
    const at = new Date("2026-11-23T18:30:00Z");
    expect(vietnamDateTime(at)).toEqual({ date: "2026-11-24", time: "01:30" });
    expect(new Date(fromVietnam("2026-11-24", "01:30")).toISOString()).toBe(at.toISOString());
    expect(formatDateTime(at)).toBe("24/11/2026 01:30");
  });
});

describe("entries", () => {
  it("knows what is still going on", () => {
    expect(isOngoing(entry({}), "2026-11-24")).toBe(true);
    expect(isOngoing(entry({ endedOn: "2026-11-24" }), "2026-11-24")).toBe(true);
    expect(isOngoing(entry({ endedOn: "2026-11-20" }), "2026-11-24")).toBe(false);
  });

  it("describes the period", () => {
    expect(entryPeriod(entry({}), "2026-11-24")).toBe("Từ 10/11/2026");
    expect(entryPeriod(entry({ endedOn: "2026-11-30" }), "2026-11-24", "en")).toBe(
      "Since 10 Nov 2026",
    );
    expect(entryPeriod(entry({ endedOn: "2026-11-10" }), "2026-11-24")).toBe("10/11/2026");
    expect(entryPeriod(entry({ endedOn: "2026-11-12" }), "2026-11-24")).toBe(
      "10/11/2026 – 12/11/2026",
    );
    expect(healthKindLabel("medication", "vi")).toBe("Thuốc");
  });

  it("splits ongoing from past and finds the recent readings", () => {
    const now = new Date("2026-11-24T05:00:00Z");
    const overview = healthOverview(
      [entry({ id: "a" }), entry({ id: "b", endedOn: "2026-11-12" })],
      [reading("2026-11-20T01:00:00Z", 372), reading("2026-11-23T10:00:00Z", 386)],
      "2026-11-24",
      now,
    );
    expect(overview.ongoing.map((e) => e.id)).toEqual(["a"]);
    expect(overview.past.map((e) => e.id)).toEqual(["b"]);
    expect(overview.latest?.tenthsC).toBe(386);
    expect(overview.recent.map((r) => r.tenthsC)).toEqual([386]);
    expect(healthOverview([], [], "2026-11-24", now).latest).toBeUndefined();
  });

  it("groups readings by their day in Vietnam, newest first", () => {
    const days = readingsByDay([
      reading("2026-11-22T20:00:00Z", 380), // 23/11 03:00
      reading("2026-11-23T02:00:00Z", 375), // 23/11 09:00
      reading("2026-11-23T18:00:00Z", 370), // 24/11 01:00
    ]);
    expect(days.map((d) => [d.date, d.readings.map((r) => r.tenthsC)])).toEqual([
      ["2026-11-24", [370]],
      ["2026-11-23", [375, 380]],
    ]);
  });
});
