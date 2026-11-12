import { describe, expect, it } from "vitest";

import { CATALOG, DISEASE_CODES, DISEASES, validateCatalog } from "./catalog.js";

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
