import { describe, expect, it } from "vitest";

import { normalCdf, percentile } from "./percentile.js";

describe("normalCdf", () => {
  it.each([
    [0, 0.5],
    [1, 0.841344746],
    [-1, 0.158655254],
    [1.959964, 0.975],
    [-1.644854, 0.05],
    [3, 0.998650102],
    [-3, 0.001349898],
  ])("Φ(%f) ≈ %f", (z, expected) => {
    expect(normalCdf(z)).toBeCloseTo(expected, 6);
  });
});

describe("percentile", () => {
  it("maps z = -2 to about the 2nd percentile", () => {
    expect(percentile(-2)).toBeCloseTo(2.275, 2);
  });
});
