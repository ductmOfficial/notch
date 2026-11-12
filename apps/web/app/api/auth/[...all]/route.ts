import { getAuth } from "../../../../lib/auth";

// Better Auth's endpoints (the magic-link verification, sign-out, session).
async function handle(request: Request): Promise<Response> {
  const auth = getAuth();
  if (!auth) return new Response("DATABASE_URL is not configured", { status: 503 });
  return auth.handler(request);
}

export { handle as GET, handle as POST };
