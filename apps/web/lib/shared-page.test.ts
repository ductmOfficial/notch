import { describe, expect, it } from "vitest";

import { isSharedPath } from "./shared-page";

describe("isSharedPath", () => {
  it("matches a shared child's page only", () => {
    expect(isSharedPath("/share/abc")).toBe(true);
    expect(isSharedPath("/share")).toBe(false);
    expect(isSharedPath("/settings")).toBe(false);
    expect(isSharedPath("/shared/abc")).toBe(false);
  });
});
