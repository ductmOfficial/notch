import { describe, expect, it } from "vitest";

import { CATALOG, COUNTRIES, DISEASE_CODES, DISEASES, validateCatalog } from "./catalog.js";

describe("CATALOG", () => {
  it("is valid", () => {
    expect(() => {
      validateCatalog(CATALOG);
    }).not.toThrow();
  });

  it("names every disease code once", () => {
    expect(DISEASES.map((d) => d.code)).toEqual([...DISEASE_CODES]);
  });

  it("maps Infanrix Hexa to six diseases", () => {
    expect(CATALOG.products.find((p) => p.code === "infanrix-hexa")?.diseases).toHaveLength(6);
  });

  it("says who makes every product and where", () => {
    for (const p of CATALOG.products) {
      expect(p.origin?.manufacturer, p.code).toMatch(/\S/);
      expect(Object.keys(COUNTRIES), p.code).toContain(p.origin?.country);
    }
    expect(CATALOG.products.find((p) => p.code === "infanrix-hexa")?.origin).toEqual({
      manufacturer: "GSK",
      country: "BE",
    });
  });

  it("names every country in Vietnamese and English", () => {
    for (const [code, name] of Object.entries(COUNTRIES)) {
      expect(code).toMatch(/^[A-Z]{2}$/);
      expect(name.vi.trim(), code).not.toBe("");
      expect(name.en.trim(), code).not.toBe("");
    }
  });
});

describe("validateCatalog", () => {
  const disease = { code: "influenza", name: { vi: "Cúm", en: "Influenza" } } as const;

  it.each([
    ["Duplicate disease", { diseases: [disease, disease], products: [] }],
    [
      "Duplicate product",
      {
        diseases: [disease],
        products: [
          { code: "x", name: "X", diseases: ["influenza"] as const },
          { code: "x", name: "X", diseases: ["influenza"] as const },
        ],
      },
    ],
    ["no diseases", { diseases: [disease], products: [{ code: "x", name: "X", diseases: [] }] }],
    [
      "unknown disease",
      { diseases: [disease], products: [{ code: "x", name: "X", diseases: ["rabies"] as const }] },
    ],
  ])("rejects: %s", (message, catalog) => {
    expect(() => {
      validateCatalog(catalog);
    }).toThrow(message);
  });
});
