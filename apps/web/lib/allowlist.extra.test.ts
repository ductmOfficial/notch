import { afterEach, describe, expect, it, vi } from "vitest";

import { allowedEmails } from "./allowlist";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("allowedEmails", () => {
  it("reads NOTCH_ALLOWED_EMAILS on every call", () => {
    vi.stubEnv("NOTCH_ALLOWED_EMAILS", "a@example.com, B@example.com");
    expect([...allowedEmails()]).toEqual(["a@example.com", "b@example.com"]);
    vi.stubEnv("NOTCH_ALLOWED_EMAILS", "");
    expect(allowedEmails().size).toBe(0);
  });
});
