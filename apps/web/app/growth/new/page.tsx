import type { Metadata } from "next";

import { FormPage } from "../../../components/FormPage";
import { MeasurementForm } from "../../../components/form/MeasurementForm";
import { NoChild, NoDatabase } from "../../../components/ui";
import { getCurrentChild } from "../../../lib/child";
import { getDb } from "../../../lib/db";
import { getI18n } from "../../../lib/i18n/server";
import { todayInVietnam } from "../../../lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("page.addMeasurement") };
}
export const dynamic = "force-dynamic";

export default async function NewMeasurementPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const { t } = await getI18n();
  const db = getDb();
  if (!db) return <NoDatabase />;
  const { child } = await getCurrentChild(db, (await searchParams).child);
  if (!child) return <NoChild />;
  return (
    <FormPage
      title={t("page.addMeasurement")}
      childName={child.name}
      back={{ href: "/growth", label: t("nav.growth") }}
    >
      <MeasurementForm childId={child.id} today={todayInVietnam()} />
    </FormPage>
  );
}
