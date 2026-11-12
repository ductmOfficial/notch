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
import { getI18n } from "../../../../lib/i18n/server";
import { formatDate, todayInVietnam } from "../../../../lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("page.editMeasurement") };
}
export const dynamic = "force-dynamic";

interface Props {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<{ child?: string }>;
}

export default async function EditMeasurementPage({ params, searchParams }: Props) {
  const { t, locale } = await getI18n();
  const db = getDb();
  if (!db) return <NoDatabase />;
  const { child } = await getCurrentChild(db, (await searchParams).child);
  if (!child) return <NoChild />;
  const measurement = await getMeasurement(db, (await params).id, child.id).catch(() => undefined);
  if (!measurement) notFound();

  return (
    <FormPage
      title={t("page.editMeasurementOn", { date: formatDate(measurement.measuredOn, locale) })}
      childName={child.name}
      back={{ href: "/growth", label: t("nav.growth") }}
      footer={
        <DeleteForm
          action={deleteMeasurementAction}
          childId={child.id}
          id={measurement.id}
          label={t("page.deleteMeasurement")}
          title={t("page.deleteMeasurementTitle", {
            date: formatDate(measurement.measuredOn, locale),
          })}
          confirm={t("page.deleteMeasurementConfirm")}
        />
      }
    >
      <MeasurementForm childId={child.id} today={todayInVietnam()} measurement={measurement} />
    </FormPage>
  );
}
