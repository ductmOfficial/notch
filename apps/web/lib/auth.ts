import "server-only";

import { maySignIn, schema } from "@notch/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";

import { allowedEmails } from "./allowlist";
import { getDb } from "./db";
import { getI18n } from "./i18n/server";
import { sendMail } from "./mail";
import { signInMail } from "./sign-in-mail";
import { siteUrls } from "./site-url";

/** Sign-in links last ten minutes and work once. */
export const LINK_MINUTES = 10;

/** How long the signed session cookie stands in for the session query. */
export const SESSION_CACHE_SECONDS = 5 * 60;

function createAuth(db: NonNullable<ReturnType<typeof getDb>>) {
  return betterAuth({
    appName: "Notch",
    // BETTER_AUTH_SECRET comes from the environment; the URL from BETTER_AUTH_URL or Vercel.
    ...siteUrls(),
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
        rateLimit: schema.rateLimit,
      },
    }),
    // On in production (Better Auth's default); kept in the database so the limit holds
    // across serverless instances. The magic-link plugin allows 5 requests a minute.
    rateLimit: { storage: "database" },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      // A signed cookie holds the session for five minutes, so most requests skip the
      // session query. The allowlist is still checked on every request (lib/session.ts);
      // a session revoked in the database ends within these five minutes.
      cookieCache: { enabled: true, maxAge: SESSION_CACHE_SECONDS },
    },
    telemetry: { enabled: false },
    databaseHooks: {
      user: {
        create: {
          // A second guard behind the one in sendMagicLink: no account for an address that
          // is neither an owner nor invited.
          before: (user) => maySignIn(db, user.email, allowedEmails()),
        },
      },
    },
    plugins: [
      magicLink({
        expiresIn: LINK_MINUTES * 60,
        storeToken: "hashed",
        sendMagicLink: async ({ email, url }) => {
          // The answer is the same either way, so the form does not reveal who may sign in.
          if (!(await maySignIn(db, email, allowedEmails()))) {
            // For the server log only, and without the address: the visitor sees "sent".
            console.info(
              "[auth] No sign-in link sent: the address is neither on NOTCH_ALLOWED_EMAILS nor invited.",
            );
            return;
          }
          const { locale } = await getI18n();
          await sendMail({ to: email, ...signInMail(url, locale, LINK_MINUTES) });
        },
      }),
      // Lets server actions set the session cookie.
      nextCookies(),
    ],
  });
}

const cache = globalThis as unknown as { notchAuth?: ReturnType<typeof createAuth> };

/** Better Auth on the app database, or undefined when DATABASE_URL is not configured. */
export function getAuth(): ReturnType<typeof createAuth> | undefined {
  const db = getDb();
  if (!db) return undefined;
  cache.notchAuth ??= createAuth(db);
  return cache.notchAuth;
}
