/** The main test server (demo child) and the one for a new, empty family. */
export const PORT = 3200;
export const EMPTY_PORT = 3201;
/** The parent the tests sign in as (the only address on the test allowlist). */
export const PARENT = "parent@example.com";
/** The signed-in session, stored by auth.setup.ts and reused by the other projects. */
export const SIGNED_IN = "e2e/.auth/parent.json";
/** Sign-in emails land in this file instead of being sent (see lib/mail.ts). */
export const OUTBOX = ".e2e-outbox.jsonl";
/** The outbox of the empty-family server. */
export const EMPTY_OUTBOX = ".e2e-outbox-empty.jsonl";
