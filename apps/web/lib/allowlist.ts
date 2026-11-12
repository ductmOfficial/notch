/**
 * Who may sign in: the comma- or space-separated emails in NOTCH_ALLOWED_EMAILS.
 * Matching ignores case and surrounding spaces. An empty or missing list lets nobody in.
 */
export function parseAllowlist(value: string | undefined): ReadonlySet<string> {
  return new Set(
    (value ?? "")
      .split(/[\s,;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.includes("@")),
  );
}

export function isAllowed(email: string, allowlist: ReadonlySet<string>): boolean {
  return allowlist.has(email.trim().toLowerCase());
}

/** The allowlist from the environment, read on every call so a change needs no rebuild. */
export const allowedEmails = () => parseAllowlist(process.env.NOTCH_ALLOWED_EMAILS);
