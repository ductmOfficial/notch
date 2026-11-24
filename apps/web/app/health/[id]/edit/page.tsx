import { getHealthEntry } from "@notch/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { deleteHealthEntryAction } from "../../../actions";
import { FormPage } from "../../../../components/FormPage";
import { DeleteForm } from "../../../../components/form/DeleteForm";
import { HealthEntryForm } from "../../../../components/form/HealthEntryForm";
import { NoChild, NoDatabase } from "../../../../components/ui";
import { getCurrentChild } from "../../../../lib/child";
import { getDb } from "../../../../lib/db";
import { todayInVietnam } from "../../../../lib/format";
import { getI18n } from "../../../../lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("health.editEntry") };
}
export const dynamic = "force-dynamic";

interface Props {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<{ child?: string }>;
}

export default async function EditHealthEntryPage({ params, searchParams }: Props) {
  const { t } = await getI18n();
  const db = await getDb();
  if (!db) return <NoDatabase />;
  const { child } = await getCurrentChild(db, (await searchParams).child);
  if (!child) return <NoChild />;
  const entry = await getHealthEntry(db, (await params).id, child.id).catch(() => undefined);
  if (!entry) notFound();
  return (
    <FormPage
      title={t("health.editEntry")}
      childName={child.name}
      back={{ href: `/health?child=${child.id}`, label: t("health.title") }}
      footer={
        <DeleteForm
          action={deleteHealthEntryAction}
          childId={child.id}
          id={entry.id}
          label={t("health.deleteEntry")}
          title={t("health.deleteEntryTitle", { title: entry.title })}
          confirm={t("health.deleteEntryConfirm")}
        />
      }
    >
      <HealthEntryForm
        childId={child.id}
        today={todayInVietnam()}
        birthDate={child.birthDate}
        entry={entry}
      />
    </FormPage>
  );
}
