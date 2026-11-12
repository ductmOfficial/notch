type Env = Readonly<Record<string, string | undefined>>;

const https = (host: string | undefined) => (host ? `https://${host}` : undefined);

/**
 * Where sign-in links point and which origins may call the auth endpoints.
 *
 * BETTER_AUTH_URL wins when set (local runs, a custom domain). On Vercel without it, links
 * point at the production domain in production and at the deployment itself in previews,
 * and the deployment, branch and production hosts are all trusted, so a preview opened from
 * its branch URL can still sign in.
 */
export function siteUrls(env: Env = process.env): { baseURL?: string; trustedOrigins: string[] } {
  const vercel = [env.VERCEL_URL, env.VERCEL_BRANCH_URL, env.VERCEL_PROJECT_PRODUCTION_URL]
    .map(https)
    .filter((url): url is string => url !== undefined);
  // An empty value (as in .env.example) counts as unset.
  const configured = env.BETTER_AUTH_URL?.trim();
  const baseURL =
    configured !== undefined && configured !== ""
      ? configured
      : env.VERCEL_ENV === "production"
        ? https(env.VERCEL_PROJECT_PRODUCTION_URL)
        : https(env.VERCEL_URL);
  return { baseURL, trustedOrigins: [...new Set(vercel)] };
}
