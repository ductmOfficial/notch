import "server-only";

import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export interface Mail {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

/**
 * Sends an email:
 * - with RESEND_API_KEY, through Resend's HTTP API, from MAIL_FROM;
 * - with MAIL_OUTBOX, appended as one JSON line to that file (tests and local runs);
 * - otherwise, outside production, printed to the server console.
 * Production without a mail service fails loudly rather than dropping sign-in links.
 */
export async function sendMail(mail: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM ?? "Notch <onboarding@resend.dev>",
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      }),
    });
    if (!response.ok) throw new Error(`Resend refused the email (${String(response.status)})`);
    return;
  }

  const outbox = process.env.MAIL_OUTBOX;
  if (outbox) {
    await mkdir(dirname(outbox), { recursive: true });
    await appendFile(outbox, `${JSON.stringify({ ...mail, sentAt: new Date().toISOString() })}\n`);
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("No mail service: set RESEND_API_KEY (or MAIL_OUTBOX for tests)");
  }
  console.info(`[mail] to ${mail.to}: ${mail.subject}\n${mail.text}`);
}
