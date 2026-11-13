import { describe, expect, it } from "vitest";

import { siteUrls } from "./site-url";

describe("siteUrls", () => {
  it("uses BETTER_AUTH_URL when set", () => {
    expect(siteUrls({ BETTER_AUTH_URL: "http://localhost:3000" })).toEqual({
      baseURL: "http://localhost:3000",
      trustedOrigins: [],
    });
  });

  it("points production links at the production domain", () => {
    const urls = siteUrls({
      VERCEL_ENV: "production",
      VERCEL_URL: "notch-abc123.vercel.app",
      VERCEL_PROJECT_PRODUCTION_URL: "notch.vercel.app",
    });
    expect(urls.baseURL).toBe("https://notch.vercel.app");
    expect(urls.trustedOrigins).toEqual([
      "https://notch-abc123.vercel.app",
      "https://notch.vercel.app",
    ]);
  });

  it("points preview links at the branch URL and trusts the deployment's own", () => {
    const urls = siteUrls({
      VERCEL_ENV: "preview",
      VERCEL_URL: "notch-def456.vercel.app",
      VERCEL_BRANCH_URL: "notch-git-feat-x.vercel.app",
      VERCEL_PROJECT_PRODUCTION_URL: "notch.vercel.app",
    });
    expect(urls.baseURL).toBe("https://notch-git-feat-x.vercel.app");
    expect(urls.trustedOrigins).toContain("https://notch-def456.vercel.app");
    // Without a branch URL (a deployment made from the CLI), the deployment itself.
    expect(siteUrls({ VERCEL_ENV: "preview", VERCEL_URL: "notch-def456.vercel.app" }).baseURL).toBe(
      "https://notch-def456.vercel.app",
    );
  });

  it("leaves the base URL to Better Auth when nothing is known", () => {
    expect(siteUrls({}).baseURL).toBeUndefined();
    expect(siteUrls({ BETTER_AUTH_URL: "" }).baseURL).toBeUndefined();
  });
});
