import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

import { DEMO_COOKIE } from "./lib/demo-cookie";

/**
 * Sends visitors without a session cookie to the sign-in page (or, for the home page, to the
 * about page). This only reads the cookie; pages, actions and routes check the session
 * itself on the server.
 */
export function proxy(request: NextRequest): NextResponse {
  // The demo reads only the in-memory demo database (lib/demo.ts), never a family's records.
  if (getSessionCookie(request) || request.cookies.get(DEMO_COOKIE)?.value === "1")
    return NextResponse.next();
  // A first visit to the address shows what Notch is; any other page asks to sign in.
  const to = request.nextUrl.pathname === "/" ? "/about" : "/sign-in";
  return NextResponse.redirect(new URL(to, request.url));
}

export const config = {
  // Everything except the sign-in page, Better Auth's endpoints, the calendar subscription
  // and the shared child's pages (their secret token is the credential), Next.js files, the
  // icons, and what installs the app: the manifest, the service worker and its offline page,
  // none of which hold data; and the about page with the demo's entry and exit.
  matcher: [
    "/((?!sign-in|api/auth|calendar/|share/|_next/|icon\\.svg|apple-icon\\.png|icons/|favicon\\.ico|manifest\\.webmanifest|sw\\.js|offline|about|demo).*)",
  ],
};
