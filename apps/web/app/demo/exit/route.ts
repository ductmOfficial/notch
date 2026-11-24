import { NextResponse } from "next/server";

import { DEMO_COOKIE } from "../../../lib/demo-cookie";

/** Leaves the demo, back to the about page or, with ?to=sign-in, to signing in. */
export function GET(request: Request): NextResponse {
  const to = new URL(request.url).searchParams.get("to") === "sign-in" ? "/sign-in" : "/about";
  const response = NextResponse.redirect(new URL(to, request.url));
  response.cookies.delete(DEMO_COOKIE);
  return response;
}
