import type { Metadata } from "next";

import { FormPage } from "../../../components/FormPage";
import { ChildProfileForm } from "../../../components/form/ChildProfileForm";
import { NoChild, NoDatabase } from "../../../components/ui";
import { getCurrentChild } from "../../../lib/child";
import { getDb } from "../../../lib/db";
import { todayInVietnam } from "../../../lib/format";
import { getI18n } from "../../../lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("page.editChild") };
}
export const dynamic = "force-dynamic";

interface Props {
  readonly searchParams: Promise<{ child?: string }>;
}

/** Edit the selected child's names, sex and birth; reached from Settings. */
export default async function EditChildPage({ searchParams }: Props) {
  const { t } = await getI18n();
  const db = getDb();
  if (!db) return <NoDatabase />;
  const { child } = await getCurrentChild(db, (await searchParams).child);
  if (!child) return <NoChild />;
  return (
    <FormPage
      title={t("page.editChild")}
      childName={child.name}
      back={{ href: "/settings", label: t("settings.title") }}
    >
      <ChildProfileForm child={child} today={todayInVietnam()} />
    </FormPage>
  );
}
