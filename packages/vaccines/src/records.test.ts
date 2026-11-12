import { describe, expect, it } from "vitest";

import { CATALOG } from "./catalog.js";
import { appointmentStates, dosesByDisease, nextAppointment } from "./records.js";

// Fixture dates only; not anyone's real record.
const RECORDS = [
  { productCode: "infanrix-hexa", doseNo: 2, givenOn: "2030-03-10" },
  { productCode: "infanrix-hexa", doseNo: 1, givenOn: "2030-02-10" },
  { productCode: "gene-hbvax", doseNo: 1, givenOn: "2030-01-01" },
];

describe("dosesByDisease", () => {
  const byDisease = dosesByDisease(RECORDS, CATALOG);

  it("counts a combined product for every disease it covers", () => {
    expect(byDisease.get("pertussis")?.map((d) => d.doseNo)).toEqual([1, 2]);
    expect(byDisease.get("polio")?.[0]?.productName).toBe("Infanrix Hexa");
  });

  it("merges doses of different products for the same disease, by date", () => {
    expect(byDisease.get("hepatitis-b")?.map((d) => d.productCode)).toEqual([
      "gene-hbvax",
      "infanrix-hexa",
      "infanrix-hexa",
    ]);
  });

  it("keeps diseases without doses, in catalog order", () => {
    expect(byDisease.get("rabies")).toEqual([]);
    expect([...byDisease.keys()][0]).toBe("tuberculosis");
  });

  it("orders same-day doses by dose number", () => {
    const sameDay = dosesByDisease(
      [
        { productCode: "rotarix", doseNo: 2, givenOn: "2030-01-01" },
        { productCode: "rotarix", doseNo: 1, givenOn: "2030-01-01" },
      ],
      CATALOG,
    );
    expect(sameDay.get("rotavirus")?.map((d) => d.doseNo)).toEqual([1, 2]);
  });

  it("rejects unknown products", () => {
    expect(() =>
      dosesByDisease([{ productCode: "nope", doseNo: 1, givenOn: "2030-01-01" }], CATALOG),
    ).toThrow('Unknown product "nope"');
  });
});

describe("appointmentStates", () => {
  const appointments = [
    { productCode: "infanrix-hexa", doseNo: 2, dueOn: "2030-03-08" },
    { productCode: "infanrix-hexa", doseNo: 3, dueOn: "2030-04-10" },
    { productCode: "bexsero", doseNo: 2, dueOn: "2030-03-20" },
    { productCode: "bexsero", doseNo: 3, dueOn: null, note: "after the first birthday" },
    { productCode: "rotarix", doseNo: 1, dueOn: "2030-03-01" },
  ];

  it("derives status and days until each appointment", () => {
    const states = appointmentStates(appointments, RECORDS, "2030-03-20");
    expect(states.map((s) => [s.status, s.daysUntil])).toEqual([
      ["fulfilled", -12],
      ["upcoming", 21],
      ["today", 0],
      ["undated", undefined],
      ["overdue", -19],
    ]);
    expect(states[0]?.givenOn).toBe("2030-03-10");
    expect(states[3]?.note).toBe("after the first birthday");
  });

  it("picks overdue appointments first, then the soonest", () => {
    expect(nextAppointment(appointmentStates(appointments, RECORDS, "2030-03-20"))).toMatchObject({
      productCode: "rotarix",
    });
    const withoutOverdue = appointments.filter((a) => a.productCode !== "rotarix");
    expect(nextAppointment(appointmentStates(withoutOverdue, RECORDS, "2030-03-15"))).toMatchObject(
      {
        productCode: "bexsero",
        doseNo: 2,
        daysUntil: 5,
      },
    );
  });

  it("returns undefined when nothing is open", () => {
    expect(
      nextAppointment(appointmentStates(appointments.slice(0, 1), RECORDS, "2030-03-20")),
    ).toBeUndefined();
  });
});
