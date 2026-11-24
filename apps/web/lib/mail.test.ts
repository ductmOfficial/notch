import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { sendMail } from "./mail";

const mail = { to: "parent@example.com", subject: "Link", text: "Open it", html: "<p>Open it</p>" };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sendMail", () => {
  it("posts to Resend when a key is set, and fails loudly when refused", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("MAIL_FROM", "Notch <notch@example.com>");
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    await sendMail(mail);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(JSON.parse(init.body as string)).toMatchObject({
      from: "Notch <notch@example.com>",
      to: ["parent@example.com"],
      subject: "Link",
    });

    fetch.mockResolvedValue(new Response(null, { status: 422 }));
    await expect(sendMail(mail)).rejects.toThrow("Resend refused the email (422)");
  });

  it("writes to the outbox file without a key", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const folder = await mkdtemp(join(tmpdir(), "notch-mail-"));
    try {
      const outbox = join(folder, "nested", "outbox.jsonl");
      vi.stubEnv("MAIL_OUTBOX", outbox);
      await sendMail(mail);
      await sendMail({ ...mail, to: "other@example.com" });
      const lines = (await readFile(outbox, "utf8")).trim().split("\n");
      expect(lines.map((l) => (JSON.parse(l) as { to: string }).to)).toEqual([
        "parent@example.com",
        "other@example.com",
      ]);
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  });

  it("prints in development and refuses to drop mail in production", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("MAIL_OUTBOX", "");
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.stubEnv("NODE_ENV", "development");
    await sendMail(mail);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("[mail] to parent@example.com"));
    vi.stubEnv("NODE_ENV", "production");
    await expect(sendMail(mail)).rejects.toThrow("No mail service");
  });
});
