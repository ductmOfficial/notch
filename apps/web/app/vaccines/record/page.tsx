import type { Metadata } from "next";

import { FormPage } from "../../../components/FormPage";
import { DoseForm } from "../../../components/form/DoseForm";
import { NoChild, NoDatabase } from "../../../components/ui";
import { getCurrentChild } from "../../../lib/child";
import { getDb } from "../../../lib/db";
import { getI18n } from "../../../lib/i18n/server";
import { todayInVietnam } from "../../../lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("page.recordDose") };
}
export const dynamic = "force-dynamic";

interface Props {
  readonly searchParams: Promise<{ child?: string; product?: string; dose?: string }>;
}

/** Opened from an appointment ("?product=bexsero&dose=2") or from scratch. */
export default async function RecordDosePage({ searchParams }: Props) {
  const params = await searchParams;
  const { t } = await getI18n();
  const db = getDb();
  if (!db) return <NoDatabase />;
  const { child } = await getCurrentChild(db, params.child);
  if (!child) return <NoChild />;
  const dose = Number(params.dose);

  return (
    <FormPage
      title={t("page.recordDose")}
      childName={child.name}
      back={{ href: "/vaccines", label: t("nav.vaccines") }}
    >
      <DoseForm
        childId={child.id}
        today={todayInVietnam()}
        productCode={params.product ?? ""}
        doseNo={Number.isInteger(dose) && dose >= 1 && dose <= 20 ? dose : 1}
      />
    </FormPage>
  );
}
