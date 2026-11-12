import { type Locale, translator } from "./i18n/messages";

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${String(c.charCodeAt(0))};`);

/**
 * The sign-in email: the link and how long it lasts, nothing about the child, so the
 * message is safe to show in any inbox preview or notification.
 */
export function signInMail(
  url: string,
  locale: Locale,
  minutes: number,
): { subject: string; text: string; html: string } {
  const t = translator(locale);
  const intro = t("mail.intro");
  const expiry = t("mail.expiry", { minutes });
  const ignore = t("mail.ignore");
  return {
    subject: t("mail.subject"),
    text: `${intro}\n\n${url}\n\n${expiry}\n${ignore}\n`,
    html: `<!doctype html><html lang="${locale}"><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#1f1a1c">
<p>${escape(intro)}</p>
<p><a href="${escape(url)}" style="display:inline-block;padding:10px 20px;border-radius:20px;background:#99405e;color:#fff;text-decoration:none">${escape(t("mail.button"))}</a></p>
<p style="color:#524346">${escape(expiry)}<br>${escape(ignore)}</p>
</body></html>`,
  };
}
