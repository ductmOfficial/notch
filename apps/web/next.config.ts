import type { NextConfig } from "next";

// Next.js reads .env files from apps/web; the database settings live in the
// repository root .env shared with the db scripts.
try {
  process.loadEnvFile("../../.env");
} catch {
  // No root .env: rely on the environment.
}

const nextConfig: NextConfig = {
  // Database drivers load native or WebAssembly code; keep them out of the bundle.
  serverExternalPackages: ["@electric-sql/pglite", "pg", "@react-pdf/renderer"],
  // The PDF report reads its fonts from disk; ship them with that route.
  outputFileTracingIncludes: { "/report.pdf": ["./assets/fonts/*.ttf"] },
  // The service worker is checked for updates on every visit, so a new one takes over soon.
  headers() {
    return Promise.resolve([
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ]);
  },
};

export default nextConfig;
