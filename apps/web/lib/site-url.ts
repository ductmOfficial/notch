type Env = Readonly<Record<string, string | undefined>>;

const https = (host: string | undefined) => (host ? `https://${host}` : undefined);

/**
 * Where sign-in links point and which origins may call the auth endpoints.
 *
 * BETTER_AUTH_URL wins when set (local runs, a custom domain). On Vercel without it, links
 * point at the production domain in production and, in previews, at the branch URL: the
 * address people open, where Vercel's preview protection already let them in. A link to the
 * deployment's own address would meet that protection again, and its sign-in redirect drops
 * the query string, token included. The deployment, branch and production hosts are all
 * trusted origins.
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
        : https(env.VERCEL_BRANCH_URL ?? env.VERCEL_URL);
  return { baseURL, trustedOrigins: [...new Set(vercel)] };
}
