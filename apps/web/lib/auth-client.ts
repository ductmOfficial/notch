"use client";

import { createAuthClient } from "better-auth/client";
import { magicLinkClient } from "better-auth/client/plugins";

/** Browser side of Better Auth: requests go to /api/auth on this site, rate limits included. */
export const authClient = createAuthClient({ plugins: [magicLinkClient()] });
