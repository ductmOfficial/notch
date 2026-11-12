import { readFile } from "node:fs/promises";

import { expect } from "@playwright/test";

import { OUTBOX } from "./constants";

interface SentMail {
  readonly to: string;
  readonly text: string;
}

/** Every email the app "sent" so far (lib/mail.ts writes them to the outbox in tests). */
export async function sentMail(outbox = OUTBOX): Promise<SentMail[]> {
  const content = await readFile(outbox, "utf8").catch(() => "");
  return content
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => JSON.parse(line) as SentMail);
}

/** The newest sign-in link sent to `to`, waiting for it to arrive. */
export async function signInLink(to: string, after = 0, outbox = OUTBOX): Promise<string> {
  let link = "";
  await expect
    .poll(async () => {
      const mails = (await sentMail(outbox)).filter((m) => m.to === to).slice(after);
      link = /https?:\/\/\S+/.exec(mails.at(-1)?.text ?? "")?.[0] ?? "";
      return link;
    })
    .not.toBe("");
  return link;
}

/** How many emails went to `to`. */
export const sentTo = async (to: string) => (await sentMail()).filter((m) => m.to === to).length;
