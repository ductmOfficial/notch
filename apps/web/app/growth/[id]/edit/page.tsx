import { getMeasurement } from "@notch/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { deleteMeasurementAction } from "../../../actions";
import { FormPage } from "../../../../components/FormPage";
import { DeleteForm } from "../../../../components/form/DeleteForm";
import { MeasurementForm } from "../../../../components/form/MeasurementForm";
import { NoChild, NoDatabase } from "../../../../components/ui";
import { getCurrentChild } from "../../../../lib/child";
import { getDb } from "../../../../lib/db";
import { formatDate, todayInVietnam } from "../../../../lib/format";

export const metadata: Metadata = { title: "Sửa lần đo" };
export const dynamic = "force-dynamic";

interface Props {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<{ child?: string }>;
}

export default async function EditMeasurementPage({ params, searchParams }: Props) {
  const db = getDb();
  if (!db) return <NoDatabase />;
  const { child } = await getCurrentChild(db, (await searchParams).child);
  if (!child) return <NoChild />;
  const measurement = await getMeasurement(db, (await params).id, child.id).catch(() => undefined);
  if (!measurement) notFound();

  return (
    <FormPage
      title={`Sửa lần đo ${formatDate(measurement.measuredOn)}`}
      childName={child.name}
      back={{ href: "/growth", label: "Tăng trưởng" }}
      footer={
        <DeleteForm
          action={deleteMeasurementAction}
          childId={child.id}
          id={measurement.id}
          label="Xoá lần đo này"
          title={`Xoá lần đo ${formatDate(measurement.measuredOn)}?`}
          confirm="Cân nặng, chiều dài và vòng đầu của lần đo này sẽ bị xoá. Không hoàn tác được."
        />
      }
    >
      <MeasurementForm childId={child.id} today={todayInVietnam()} measurement={measurement} />
    </FormPage>
  );
}
