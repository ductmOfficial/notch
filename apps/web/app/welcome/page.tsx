import { listChildren } from "@notch/db";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChildForm } from "../../components/form/ChildForm";
import { MotifMark } from "../../components/Motifs";
import { Card, NoDatabase } from "../../components/ui";
import { getDb } from "../../lib/db";
import { todayInVietnam } from "../../lib/format";
import { getI18n } from "../../lib/i18n/server";
import { requireViewer } from "../../lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("welcome.title") };
}

export const dynamic = "force-dynamic";

/** First run: the signed-in family has no child yet. Families that do go to Today. */
export default async function WelcomePage() {
  const { familyId } = await requireViewer();
  const db = getDb();
  if (!db) return <NoDatabase />;
  if ((await listChildren(db, familyId)).length > 0) redirect("/");
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-xl pt-2">
      <Card tone="outlined" className="space-y-6 p-6">
        <header className="space-y-2">
          <MotifMark size={48} />
          <h1 className="headline-small">{t("welcome.title")}</h1>
          <p className="body-medium text-on-surface-variant">{t("welcome.intro")}</p>
        </header>
        <ChildForm today={todayInVietnam()} />
      </Card>
    </div>
  );
}
