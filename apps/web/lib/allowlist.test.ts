import { describe, expect, it } from "vitest";

import { isAllowed, parseAllowlist } from "./allowlist";

describe("allowlist", () => {
  it("reads emails separated by commas, semicolons or spaces, ignoring case", () => {
    const list = parseAllowlist(" Parent@Example.com, other@example.com;third@example.com\n");
    expect([...list]).toEqual(["parent@example.com", "other@example.com", "third@example.com"]);
    expect(isAllowed("PARENT@example.com ", list)).toBe(true);
  });

  it("lets nobody in when empty or missing", () => {
    expect(parseAllowlist(undefined).size).toBe(0);
    expect(parseAllowlist(" , ").size).toBe(0);
    expect(isAllowed("parent@example.com", parseAllowlist(""))).toBe(false);
  });

  it("does not match part of an address", () => {
    const list = parseAllowlist("parent@example.com");
    expect(isAllowed("arent@example.com", list)).toBe(false);
    expect(isAllowed("parent@example.co", list)).toBe(false);
  });
});
