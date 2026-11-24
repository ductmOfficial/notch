import type { Metadata } from "next";

import { FormPage } from "../../../components/FormPage";
import { HealthEntryForm } from "../../../components/form/HealthEntryForm";
import { NoChild, NoDatabase } from "../../../components/ui";
import { getCurrentChild } from "../../../lib/child";
import { getDb } from "../../../lib/db";
import { todayInVietnam } from "../../../lib/format";
import { HEALTH_KINDS, type HealthKind } from "../../../lib/health-view";
import { getI18n } from "../../../lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("health.addEntry") };
}
export const dynamic = "force-dynamic";

interface Props {
  readonly searchParams: Promise<{ child?: string; kind?: string }>;
}

export default async function NewHealthEntryPage({ searchParams }: Props) {
  const { t } = await getI18n();
  const db = getDb();
  if (!db) return <NoDatabase />;
  const params = await searchParams;
  const { child } = await getCurrentChild(db, params.child);
  if (!child) return <NoChild />;
  const kind = (HEALTH_KINDS as readonly string[]).includes(params.kind ?? "")
    ? (params.kind as HealthKind)
    : "illness";
  return (
    <FormPage
      title={t("health.addEntry")}
      childName={child.name}
      back={{ href: `/health?child=${child.id}`, label: t("health.title") }}
    >
      <HealthEntryForm
        childId={child.id}
        today={todayInVietnam()}
        birthDate={child.birthDate}
        kind={kind}
      />
    </FormPage>
  );
}
