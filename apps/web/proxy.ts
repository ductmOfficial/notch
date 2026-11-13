import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Sends visitors without a session cookie to the sign-in page. This only reads the
 * cookie; pages, actions and routes check the session itself on the server.
 */
export function proxy(request: NextRequest): NextResponse {
  if (getSessionCookie(request)) return NextResponse.next();
  return NextResponse.redirect(new URL("/sign-in", request.url));
}

export const config = {
  // Everything except the sign-in page, Better Auth's endpoints, the calendar subscription
  // (its secret token is the credential), Next.js files and the icon.
  matcher: ["/((?!sign-in|api/auth|calendar/|_next/|icon\\.svg|favicon\\.ico).*)"],
};
