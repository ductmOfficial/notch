import type { Metadata } from "next";
import Link from "next/link";

import { BUTTON } from "../components/button-styles";
import { MotifMark } from "../components/Motifs";
import { getI18n } from "../lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("notFound.title") };
}

/** An address the app does not have, or a record that is not the family's. */
export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 pt-12">
      <MotifMark size={48} />
      <h1 className="headline-medium">{t("notFound.title")}</h1>
      <p className="body-large text-on-surface-variant">{t("notFound.body")}</p>
      <Link href="/" className={BUTTON.tonal}>
        {t("notFound.home")}
      </Link>
    </div>
  );
}
