import type { Metadata } from "next";

import { FormPage } from "../../../components/FormPage";
import { MeasurementForm } from "../../../components/form/MeasurementForm";
import { NoChild, NoDatabase } from "../../../components/ui";
import { getCurrentChild } from "../../../lib/child";
import { getDb } from "../../../lib/db";
import { todayInVietnam } from "../../../lib/format";

export const metadata: Metadata = { title: "Thêm lần đo" };
export const dynamic = "force-dynamic";

export default async function NewMeasurementPage({
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
      title="Thêm lần đo"
      childName={child.name}
      back={{ href: "/growth", label: "Tăng trưởng" }}
    >
      <MeasurementForm childId={child.id} today={todayInVietnam()} />
    </FormPage>
  );
}
