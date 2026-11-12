import type { AppointmentState } from "@notch/vaccines";
import { describe, expect, it } from "vitest";

import { buildVaccinationView, dueLabel, productName } from "./vaccines-view";

// Fixture only; not anyone's real record.
const RECORDS = [
  { productCode: "gene-hbvax", doseNo: 1, givenOn: "2030-01-01" },
  { productCode: "infanrix-hexa", doseNo: 1, givenOn: "2030-03-01" },
  { productCode: "rotarix", doseNo: 1, givenOn: "2030-03-01" },
];
const APPOINTMENTS = [
  { productCode: "infanrix-hexa", doseNo: 1, dueOn: "2030-03-01" },
  { productCode: "infanrix-hexa", doseNo: 2, dueOn: "2030-04-01" },
  { productCode: "rotarix", doseNo: 2, dueOn: "2030-03-10" },
  { productCode: "bexsero", doseNo: 1, dueOn: "2030-03-25" },
  { productCode: "bexsero", doseNo: 3, dueOn: null, note: "after the first birthday" },
];

describe("buildVaccinationView", () => {
  const view = buildVaccinationView(RECORDS, APPOINTMENTS, "2030-03-20");

  it("puts overdue appointments first, then the soonest", () => {
    expect(view.open.map((s) => [s.productCode, s.doseNo, s.status])).toEqual([
      ["rotarix", 2, "overdue"],
      ["bexsero", 1, "upcoming"],
      ["infanrix-hexa", 2, "upcoming"],
    ]);
    expect(view.next).toMatchObject({ productCode: "rotarix", doseNo: 2 });
  });

  it("keeps undated appointments apart and drops fulfilled ones", () => {
    expect(view.undated.map((s) => s.note)).toEqual(["after the first birthday"]);
    expect([...view.open, ...view.undated].some((s) => s.status === "fulfilled")).toBe(false);
  });

  it("splits diseases into covered and uncovered, in book order", () => {
    expect(view.covered.map((r) => r.code)).toEqual([
      "hepatitis-b",
      "diphtheria",
      "tetanus",
      "pertussis",
      "hib",
      "polio",
      "rotavirus",
    ]);
    expect(view.covered[0]?.doses.map((d) => d.productName)).toEqual([
      "Gene-HBvax",
      "Infanrix Hexa",
    ]);
    expect(view.uncovered).toHaveLength(22 - 7);
    expect(view.uncovered[0]?.name).toBe("Lao");
  });

  it("lists doses newest first with the diseases they cover", () => {
    expect(view.history.map((h) => h.productName)).toEqual([
      "Infanrix Hexa",
      "Rotarix",
      "Gene-HBvax",
    ]);
    expect(view.history[0]?.diseases).toHaveLength(6);
  });

  it("handles a child without records", () => {
    const empty = buildVaccinationView([], [], "2030-03-20");
    expect(empty.next).toBeUndefined();
    expect(empty.covered).toEqual([]);
    expect(empty.uncovered).toHaveLength(22);
  });

  it("falls back to codes for products and diseases missing from the catalog", () => {
    const catalog = {
      diseases: [],
      products: [{ code: "x", name: "X", diseases: ["influenza" as const] }],
    };
    const custom = buildVaccinationView(
      [{ productCode: "x", doseNo: 1, givenOn: "2030-01-01" }],
      [],
      "2030-03-20",
      catalog,
    );
    expect(custom.history[0]?.diseases).toEqual(["influenza"]);
    expect(productName("unknown")).toBe("unknown");
  });
});

describe("dueLabel", () => {
  const state = (over: Partial<AppointmentState>): AppointmentState => ({
    productCode: "bexsero",
    doseNo: 2,
    dueOn: "2030-03-20",
    status: "upcoming",
    daysUntil: 0,
    givenOn: undefined,
    ...over,
  });

  it.each([
    [{ status: "today" as const, daysUntil: 0 }, "Hôm nay"],
    [{ daysUntil: 1 }, "Ngày mai"],
    [{ daysUntil: 14 }, "Còn 14 ngày"],
    [{ status: "overdue" as const, daysUntil: -3 }, "Quá hạn 3 ngày"],
    [{ status: "undated" as const, dueOn: null, daysUntil: undefined }, "Chưa có ngày"],
    [{ status: "fulfilled" as const, givenOn: "2030-03-18" }, "Đã tiêm 18/03/2030"],
    [{ status: "fulfilled" as const, givenOn: undefined }, "Đã tiêm"],
  ])("%o → %s", (over, label) => {
    expect(dueLabel(state(over))).toBe(label);
  });
});
