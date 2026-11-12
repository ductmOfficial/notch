import type { Metadata } from "next";

import { FormPage } from "../../../../components/FormPage";
import { AppointmentForm } from "../../../../components/form/AppointmentForm";
import { NoChild, NoDatabase } from "../../../../components/ui";
import { getCurrentChild } from "../../../../lib/child";
import { getDb } from "../../../../lib/db";

export const metadata: Metadata = { title: "Thêm lịch hẹn" };
export const dynamic = "force-dynamic";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const db = getDb();
  if (!db) return <NoDatabase />;
  const { child } = await getCurrentChild(db, (await searchParams).child);
  if (!child) return <NoChild />;
  return (
    <FormPage
      title="Thêm lịch hẹn"
      childName={child.name}
      back={{ href: "/vaccines", label: "Tiêm chủng" }}
    >
      <AppointmentForm childId={child.id} />
    </FormPage>
  );
}
