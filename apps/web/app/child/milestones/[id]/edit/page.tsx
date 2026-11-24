import { getMilestone } from "@notch/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { deleteMilestoneAction } from "../../../../actions";
import { FormPage } from "../../../../../components/FormPage";
import { DeleteForm } from "../../../../../components/form/DeleteForm";
import { MilestoneForm } from "../../../../../components/form/MilestoneForm";
import { NoChild, NoDatabase } from "../../../../../components/ui";
import { getCurrentChild } from "../../../../../lib/child";
import { getDb } from "../../../../../lib/db";
import { todayInVietnam } from "../../../../../lib/format";
import { getI18n } from "../../../../../lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("milestone.edit") };
}
export const dynamic = "force-dynamic";

interface Props {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<{ child?: string }>;
}

export default async function EditMilestonePage({ params, searchParams }: Props) {
  const { t } = await getI18n();
  const db = await getDb();
  if (!db) return <NoDatabase />;
  const { child } = await getCurrentChild(db, (await searchParams).child);
  if (!child) return <NoChild />;
  const milestone = await getMilestone(db, (await params).id, child.id).catch(() => undefined);
  if (!milestone) notFound();
  return (
    <FormPage
      title={t("milestone.edit")}
      childName={child.name}
      back={{ href: `/child?child=${child.id}`, label: t("child.title", { name: child.name }) }}
      footer={
        <DeleteForm
          action={deleteMilestoneAction}
          childId={child.id}
          id={milestone.id}
          label={t("milestone.delete")}
          title={t("milestone.deleteTitle", { title: milestone.title })}
          confirm={t("milestone.deleteConfirm")}
        />
      }
    >
      <MilestoneForm
        childId={child.id}
        today={todayInVietnam()}
        birthDate={child.birthDate}
        milestone={milestone}
      />
    </FormPage>
  );
}
