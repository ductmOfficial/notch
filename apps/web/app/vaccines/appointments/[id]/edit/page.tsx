import { getAppointment } from "@notch/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { deleteAppointmentAction } from "../../../../actions";
import { FormPage } from "../../../../../components/FormPage";
import { AppointmentForm } from "../../../../../components/form/AppointmentForm";
import { DeleteForm } from "../../../../../components/form/DeleteForm";
import { NoChild, NoDatabase } from "../../../../../components/ui";
import { getCurrentChild } from "../../../../../lib/child";
import { getDb } from "../../../../../lib/db";
import { getI18n } from "../../../../../lib/i18n/server";
import { productName } from "../../../../../lib/vaccines-view";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("page.editAppointment") };
}
export const dynamic = "force-dynamic";

interface Props {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<{ child?: string }>;
}

export default async function EditAppointmentPage({ params, searchParams }: Props) {
  const { t } = await getI18n();
  const db = getDb();
  if (!db) return <NoDatabase />;
  const { child } = await getCurrentChild(db, (await searchParams).child);
  if (!child) return <NoChild />;
  const appointment = await getAppointment(db, (await params).id, child.id).catch(() => undefined);
  if (!appointment) notFound();

  return (
    <FormPage
      title={t("page.editAppointmentOf", {
        product: productName(appointment.productCode),
        n: appointment.doseNo,
      })}
      childName={child.name}
      back={{ href: "/vaccines", label: t("nav.vaccines") }}
      footer={
        <DeleteForm
          action={deleteAppointmentAction}
          childId={child.id}
          id={appointment.id}
          label={t("page.deleteAppointment")}
          title={t("page.deleteAppointmentTitle")}
          confirm={t("page.deleteAppointmentConfirm", {
            product: productName(appointment.productCode),
            n: appointment.doseNo,
          })}
        />
      }
    >
      <AppointmentForm childId={child.id} appointment={appointment} />
    </FormPage>
  );
}
