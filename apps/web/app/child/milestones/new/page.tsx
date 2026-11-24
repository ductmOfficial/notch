import type { Metadata } from "next";

import { FormPage } from "../../../../components/FormPage";
import { MilestoneForm } from "../../../../components/form/MilestoneForm";
import { NoChild, NoDatabase } from "../../../../components/ui";
import { getCurrentChild } from "../../../../lib/child";
import { getDb } from "../../../../lib/db";
import { todayInVietnam } from "../../../../lib/format";
import { getI18n } from "../../../../lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("milestone.add") };
}
export const dynamic = "force-dynamic";

interface Props {
  readonly searchParams: Promise<{ child?: string }>;
}

export default async function NewMilestonePage({ searchParams }: Props) {
  const { t } = await getI18n();
  const db = getDb();
  if (!db) return <NoDatabase />;
  const { child } = await getCurrentChild(db, (await searchParams).child);
  if (!child) return <NoChild />;
  return (
    <FormPage
      title={t("milestone.add")}
      childName={child.name}
      back={{ href: `/child?child=${child.id}`, label: t("child.title", { name: child.name }) }}
    >
      <MilestoneForm childId={child.id} today={todayInVietnam()} birthDate={child.birthDate} />
    </FormPage>
  );
}
