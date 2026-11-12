import { describe, expect, it } from "vitest";

import { en, negotiateLocale, translator, vi } from "./messages";

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("messages", () => {
  it("English has exactly the Vietnamese keys", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(vi).sort());
  });

  it.each(Object.keys(vi) as (keyof typeof vi)[])("%s uses the same placeholders", (key) => {
    expect(placeholders(en[key])).toEqual(placeholders(vi[key]));
  });

  it("fills placeholders and leaves unknown ones", () => {
    const t = translator("vi");
    expect(t("today.heading", { name: "Mây", age: "1 tuổi" })).toBe("Mây được 1 tuổi");
    expect(t("common.dose")).toBe("mũi {n}");
  });
});

describe("negotiateLocale", () => {
  it.each([
    ["en-US,en;q=0.9", "en"],
    ["fr-FR, en;q=0.5", "en"],
    ["vi-VN,vi;q=0.9,en;q=0.8", "vi"],
    ["de-DE", "vi"],
    [null, "vi"],
  ] as const)("%s → %s", (header, locale) => {
    expect(negotiateLocale(header)).toBe(locale);
  });
});
