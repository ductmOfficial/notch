import type { Metadata } from "next";

import { MotifMark } from "../../components/Motifs";
import { BUTTON } from "../../components/button-styles";
import { getI18n } from "../../lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("offline.title") };
}

/**
 * Shown by the service worker (public/sw.js) when a page cannot load. It is cached without
 * a session, so it holds nothing about the family; the records themselves are never cached.
 */
export default async function OfflinePage() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <MotifMark size={56} className="mx-auto" />
      <h1 className="headline-small">{t("offline.title")}</h1>
      <p className="body-medium text-on-surface-variant">{t("offline.body")}</p>
      {/* A full page load on purpose: client navigation would not retry the network. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className={`${BUTTON.filled} mx-auto w-fit`}>
        {t("offline.retry")}
      </a>
    </div>
  );
}
