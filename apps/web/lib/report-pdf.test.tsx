import type { Child, Measurement } from "@notch/db";
import { describe, expect, it } from "vitest";

import { renderReport } from "./report-pdf";

// A fictional child; no real record.
const child = {
  id: "c1",
  familyId: "f1",
  name: "Mây",
  fullName: null,
  englishName: null,
  sex: "female",
  birthDate: "2025-05-20",
  birthTime: null,
  createdAt: new Date("2025-05-20T00:00:00Z"),
} satisfies Child;

const measurement = (measuredOn: string, weightG: number, lengthMm: number): Measurement => ({
  id: measuredOn,
  childId: "c1",
  measuredOn,
  weightG,
  lengthMm,
  headMm: null,
  position: "lying",
  weightEstimated: false,
  lengthEstimated: false,
  headEstimated: false,
  note: null,
  createdAt: new Date(`${measuredOn}T00:00:00Z`),
});

describe("renderReport", () => {
  it("draws every text, the chart labels included, in Roboto", async () => {
    const pdf = await renderReport({
      child,
      measurements: [measurement("2025-08-20", 6100, 610), measurement("2025-11-20", 7600, 670)],
      vaccinations: [],
      appointments: [],
      locale: "vi",
      today: "2025-11-24",
    });
    const text = pdf.toString("latin1");
    expect(text.startsWith("%PDF")).toBe(true);
    expect(text).toContain("Roboto");
    // Helvetica, react-pdf's fallback, has no minus sign: the −2 and −3 labels lost it.
    expect(text).not.toContain("/Helvetica");
  }, 30_000);

  it("adds the health log and the latest temperatures", async () => {
    const pdf = await renderReport({
      child,
      measurements: [],
      vaccinations: [],
      appointments: [],
      healthEntries: [
        {
          id: "e1",
          childId: "c1",
          kind: "illness",
          title: "Sốt",
          startedOn: "2025-11-20",
          endedOn: null,
          note: "Ho nhẹ",
          createdAt: new Date("2025-11-20T00:00:00Z"),
        },
      ],
      temperatures: [
        {
          id: "t1",
          childId: "c1",
          measuredAt: new Date("2025-11-20T12:00:00Z"),
          tenthsC: 385,
          healthEntryId: "e1",
          note: null,
          createdAt: new Date("2025-11-20T12:00:00Z"),
        },
      ],
      locale: "en",
      today: "2025-11-24",
    });
    expect(pdf.byteLength).toBeGreaterThan(1000);
  }, 30_000);
});
