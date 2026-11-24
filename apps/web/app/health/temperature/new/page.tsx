import { listHealthEntries } from "@notch/db";
import type { Metadata } from "next";

import { FormPage } from "../../../../components/FormPage";
import { TemperatureForm } from "../../../../components/form/TemperatureForm";
import { NoChild, NoDatabase } from "../../../../components/ui";
import { getCurrentChild } from "../../../../lib/child";
import { getDb } from "../../../../lib/db";
import { todayInVietnam } from "../../../../lib/format";
import { isOngoing } from "../../../../lib/health-view";
import { getI18n } from "../../../../lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("health.addTemperature") };
}
export const dynamic = "force-dynamic";

interface Props {
  readonly searchParams: Promise<{ child?: string; entry?: string }>;
}

export default async function NewTemperaturePage({ searchParams }: Props) {
  const { t } = await getI18n();
  const db = getDb();
  if (!db) return <NoDatabase />;
  const params = await searchParams;
  const { child } = await getCurrentChild(db, params.child);
  if (!child) return <NoChild />;
  const today = todayInVietnam();
  // A new reading usually belongs to something going on now: offer those first.
  const entries = (await listHealthEntries(db, child.id)).sort(
    (a, b) => Number(isOngoing(b, today)) - Number(isOngoing(a, today)),
  );
  const entryId = entries.some((e) => e.id === params.entry) ? params.entry : undefined;
  return (
    <FormPage
      title={t("health.addTemperature")}
      childName={child.name}
      back={{ href: `/health?child=${child.id}`, label: t("health.title") }}
    >
      <TemperatureForm
        childId={child.id}
        now={new Date().toISOString()}
        birthDate={child.birthDate}
        entries={entries}
        entryId={entryId}
      />
    </FormPage>
  );
}
