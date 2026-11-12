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
import { productName } from "../../../../../lib/vaccines-view";

export const metadata: Metadata = { title: "Sửa lịch hẹn" };
export const dynamic = "force-dynamic";

interface Props {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<{ child?: string }>;
}

export default async function EditAppointmentPage({ params, searchParams }: Props) {
  const db = getDb();
  if (!db) return <NoDatabase />;
  const { child } = await getCurrentChild(db, (await searchParams).child);
  if (!child) return <NoChild />;
  const appointment = await getAppointment(db, (await params).id, child.id).catch(() => undefined);
  if (!appointment) notFound();

  return (
    <FormPage
      title={`Sửa lịch hẹn ${productName(appointment.productCode)} mũi ${String(appointment.doseNo)}`}
      childName={child.name}
      back={{ href: "/vaccines", label: "Tiêm chủng" }}
      footer={
        <DeleteForm
          action={deleteAppointmentAction}
          childId={child.id}
          id={appointment.id}
          label="Xoá lịch hẹn này"
          confirm="Không hoàn tác được."
        />
      }
    >
      <AppointmentForm childId={child.id} appointment={appointment} />
    </FormPage>
  );
}
