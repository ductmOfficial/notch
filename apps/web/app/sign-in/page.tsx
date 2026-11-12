import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MotifMark } from "../../components/Motifs";
import { SignInForm } from "../../components/SignInForm";
import { Card } from "../../components/ui";
import { LINK_MINUTES } from "../../lib/auth";
import { getI18n } from "../../lib/i18n/server";
import { getViewer } from "../../lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("signIn.title") };
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getViewer()) redirect("/");
  const { t } = await getI18n();
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-md pt-6 md:pt-16">
      <Card tone="outlined" className="space-y-6 p-6">
        <header className="space-y-2">
          <MotifMark size={48} />
          <h1 className="headline-small">{t("signIn.title")}</h1>
          <p className="body-medium text-on-surface-variant">{t("signIn.intro")}</p>
        </header>
        <SignInForm minutes={LINK_MINUTES} linkExpired={error !== undefined} />
      </Card>
    </div>
  );
}
