import { getTemperature, listHealthEntries } from "@notch/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { deleteTemperatureAction } from "../../../../actions";
import { FormPage } from "../../../../../components/FormPage";
import { DeleteForm } from "../../../../../components/form/DeleteForm";
import { TemperatureForm } from "../../../../../components/form/TemperatureForm";
import { NoChild, NoDatabase } from "../../../../../components/ui";
import { getCurrentChild } from "../../../../../lib/child";
import { getDb } from "../../../../../lib/db";
import { formatTemperature } from "../../../../../lib/health-view";
import { getI18n } from "../../../../../lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("health.editTemperature") };
}
export const dynamic = "force-dynamic";

interface Props {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<{ child?: string }>;
}

export default async function EditTemperaturePage({ params, searchParams }: Props) {
  const { t, locale } = await getI18n();
  const db = await getDb();
  if (!db) return <NoDatabase />;
  const { child } = await getCurrentChild(db, (await searchParams).child);
  if (!child) return <NoChild />;
  const [reading, entries] = await Promise.all([
    getTemperature(db, (await params).id, child.id).catch(() => undefined),
    listHealthEntries(db, child.id),
  ]);
  if (!reading) notFound();
  return (
    <FormPage
      title={t("health.editTemperature")}
      childName={child.name}
      back={{ href: `/health?child=${child.id}`, label: t("health.title") }}
      footer={
        <DeleteForm
          action={deleteTemperatureAction}
          childId={child.id}
          id={reading.id}
          label={t("health.deleteTemperature")}
          title={t("health.deleteTemperatureTitle", {
            value: formatTemperature(reading.tenthsC, locale),
          })}
          confirm={t("health.deleteTemperatureConfirm")}
        />
      }
    >
      <TemperatureForm
        childId={child.id}
        now={new Date().toISOString()}
        birthDate={child.birthDate}
        entries={entries}
        reading={reading}
      />
    </FormPage>
  );
}
