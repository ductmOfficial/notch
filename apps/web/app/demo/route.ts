import { NextResponse } from "next/server";

import { DEMO_COOKIE } from "../../lib/demo-cookie";

/** Starts the demo for this browser: Today of the fictional child, read-only, no account. */
export function GET(request: Request): NextResponse {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(DEMO_COOKIE, "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
