import type { Metadata } from "next";

import { FormPage } from "../../../../components/FormPage";
import { AppointmentForm } from "../../../../components/form/AppointmentForm";
import { NoChild, NoDatabase } from "../../../../components/ui";
import { getCurrentChild } from "../../../../lib/child";
import { getDb } from "../../../../lib/db";
import { getI18n } from "../../../../lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("page.addAppointment") };
}
export const dynamic = "force-dynamic";

export default async function NewAppointmentPage({
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
      title={t("page.addAppointment")}
      childName={child.name}
      back={{ href: "/vaccines", label: t("nav.vaccines") }}
    >
      <AppointmentForm childId={child.id} />
    </FormPage>
  );
}
