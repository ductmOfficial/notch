import type { Measurement, Milestone, Vaccination } from "@notch/db";
import { describe, expect, it } from "vitest";

import { buildTimeline, isTimelineFilter, milestoneKindLabel } from "./child-timeline";

// Fixture only; not anyone's real record.
const at = new Date(0);
const milestone = (id: string, happenedOn: string, title: string): Milestone => ({
  id,
  childId: "c",
  kind: "teeth",
  title,
  happenedOn,
  note: null,
  createdAt: at,
});
const measurement = (id: string, measuredOn: string): Measurement => ({
  id,
  childId: "c",
  measuredOn,
  weightG: 8600,
  lengthMm: 690,
  headMm: 432,
  position: null,
  weightEstimated: false,
  lengthEstimated: false,
  headEstimated: false,
  note: null,
  createdAt: at,
});
const dose = (id: string, givenOn: string): Vaccination => ({
  id,
  childId: "c",
  productCode: "bexsero",
  doseNo: 2,
  givenOn,
  place: null,
  lot: null,
  note: null,
  createdAt: at,
});

const input = {
  milestones: [milestone("1", "2030-07-10", "First tooth")],
  measurements: [measurement("2", "2030-07-10"), measurement("3", "2030-05-01")],
  vaccinations: [dose("4", "2030-06-20")],
};

describe("buildTimeline", () => {
  it("groups events by month, newest first, milestones first on a shared day", () => {
    const months = buildTimeline(input, "c");
    expect(months.map((m) => m.month)).toEqual(["2030-07", "2030-06", "2030-05"]);
    expect(months[0]?.events.map((e) => e.kind)).toEqual(["milestone", "measurement"]);
    expect(months[0]?.events[0]).toMatchObject({
      title: "First tooth",
      href: "/child/milestones/1/edit?child=c",
    });
    expect(months[0]?.events[1]?.detail).toBe("8,60 kg · 69,0 cm · vòng đầu 43,2 cm");
    expect(months[1]?.events[0]).toMatchObject({
      title: "Bexsero · mũi 2",
      detail: "Não mô cầu nhóm B",
      href: null,
    });
  });

  it("keeps one kind when filtered", () => {
    expect(buildTimeline(input, "c", "dose").flatMap((m) => m.events.map((e) => e.kind))).toEqual([
      "dose",
    ]);
    expect(buildTimeline(input, "c", "milestone", "en")[0]?.events).toHaveLength(1);
    expect(buildTimeline({ milestones: [], measurements: [], vaccinations: [] }, "c")).toEqual([]);
  });

  it("adds the health log, after milestones on a shared day", () => {
    const entry = {
      id: "5",
      childId: "c",
      kind: "illness" as const,
      title: "Sốt",
      startedOn: "2030-07-10",
      endedOn: null,
      note: null,
      createdAt: new Date("2030-07-10T00:00:00Z"),
    };
    const months = buildTimeline(
      { ...input, healthEntries: [entry] },
      "c",
      "all",
      "vi",
      "2030-07-12",
    );
    expect(months[0]?.events.map((e) => e.kind)).toEqual(["milestone", "health", "measurement"]);
    expect(months[0]?.events[1]).toMatchObject({
      title: "Sốt",
      detail: "Ốm · Từ 10/07/2030",
      href: "/health/5/edit?child=c",
    });
    expect(
      buildTimeline({ ...input, healthEntries: [entry] }, "c", "health").flatMap((m) =>
        m.events.map((e) => e.kind),
      ),
    ).toEqual(["health"]);
  });

  it("knows its filters and names milestone kinds", () => {
    expect(isTimelineFilter("measurement")).toBe(true);
    expect(isTimelineFilter("photos")).toBe(false);
    expect(milestoneKindLabel("teeth", "vi")).toBe("Răng");
    expect(milestoneKindLabel("motor", "en")).toBe("Movement");
  });
});
