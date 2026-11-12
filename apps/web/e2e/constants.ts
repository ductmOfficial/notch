/** The parent the tests sign in as (the only address on the test allowlist). */
export const PARENT = "parent@example.com";
/** The signed-in session, stored by auth.setup.ts and reused by the other projects. */
export const SIGNED_IN = "e2e/.auth/parent.json";
/** Sign-in emails land in this file instead of being sent (see lib/mail.ts). */
export const OUTBOX = ".e2e-outbox.jsonl";
