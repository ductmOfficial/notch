import type { Metadata } from "next";
import Link from "next/link";

import { BUTTON } from "../../../components/button-styles";
import { MotifMark } from "../../../components/Motifs";
import { getI18n } from "../../../lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("share.goneTitle"), robots: { index: false, follow: false } };
}

/** An unknown, revoked or expired share link: no hint of whose page it was. */
export default async function ShareLinkGone() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 pt-12">
      <MotifMark size={48} />
      <h1 className="headline-medium">{t("share.goneTitle")}</h1>
      <p className="body-large text-on-surface-variant">{t("share.gone")}</p>
      <Link href="/about" className={BUTTON.tonal}>
        {t("share.about")}
      </Link>
    </div>
  );
}
