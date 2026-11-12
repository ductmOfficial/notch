import { listAppointments, listVaccinations } from "@notch/db";
import type { Metadata } from "next";
import Link from "next/link";

import { deleteDoseAction } from "../actions";
import { AppointmentBadge } from "../../components/AppointmentBadge";
import { BUTTON } from "../../components/button-styles";
import { DeleteForm } from "../../components/form/DeleteForm";
import { Icon } from "../../components/icons";
import { Card, NoChild, NoDatabase } from "../../components/ui";
import { getCurrentChild } from "../../lib/child";
import { getDb } from "../../lib/db";
import { getI18n } from "../../lib/i18n/server";
import { formatAge, formatDate, todayInVietnam } from "../../lib/format";
import { buildVaccinationView, productName } from "../../lib/vaccines-view";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("vaccines.title") };
}
export const dynamic = "force-dynamic";

interface Props {
  readonly searchParams: Promise<{ child?: string | string[] }>;
}

export default async function VaccinesPage({ searchParams }: Props) {
  const params = await searchParams;
  const { t, locale } = await getI18n();
  const db = getDb();
  if (!db) return <NoDatabase />;
  const { child } = await getCurrentChild(db, params.child);
  if (!child) return <NoChild />;

  const [doses, appointments] = await Promise.all([
    listVaccinations(db, child.id),
    listAppointments(db, child.id),
  ]);
  const today = todayInVietnam();
  const view = buildVaccinationView(doses, appointments, today, undefined, locale);
  // Views work on product + dose number; map them back to row ids for edit links.
  const key = (productCode: string, doseNo: number) => `${productCode}#${String(doseNo)}`;
  const appointmentIds = new Map(appointments.map((a) => [key(a.productCode, a.doseNo), a.id]));
  const doseIds = new Map(doses.map((d) => [key(d.productCode, d.doseNo), d.id]));

  return (
    <div className="space-y-6 pt-2">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="headline-medium">{t("vaccines.heading", { name: child.name })}</h1>
          <p className="body-medium mt-1 text-on-surface-variant">
            {t("vaccines.subtitle", {
              age: formatAge(child.birthDate, today, locale),
              doses: doses.length,
              covered: view.covered.length,
              total: view.covered.length + view.uncovered.length,
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/calendar.ics" download className={BUTTON.outlined}>
            <Icon name="download" size={18} />
            {t("vaccines.download")}
          </a>
          <Link href="/vaccines/appointments/new" className={BUTTON.tonal}>
            <Icon name="event" size={18} />
            {t("vaccines.addAppointment")}
          </Link>
          <Link href="/vaccines/record" className={BUTTON.filled}>
            <Icon name="add" size={18} />
            {t("vaccines.recordDose")}
          </Link>
        </div>
      </header>

      <Card className="p-0">
        <h2 id="appointments-title" className="title-medium px-4 pt-4 pb-2">
          {t("vaccines.appointments")}
        </h2>
        {view.open.length === 0 && view.undated.length === 0 ? (
          <p className="body-medium px-4 pb-4 text-on-surface-variant">
            {t("vaccines.noAppointments")}
          </p>
        ) : (
          <ul aria-labelledby="appointments-title" className="divide-y divide-outline-variant pb-2">
            {[...view.open, ...view.undated].map((a) => (
              <li
                key={`${a.productCode}-${String(a.doseNo)}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
              >
                <span className="min-w-44">
                  <span className="body-large block">
                    {productName(a.productCode)}
                    <span className="text-on-surface-variant">
                      {" "}
                      · {t("common.dose", { n: a.doseNo })}
                    </span>
                  </span>
                  <span className="body-medium tabular-nums text-on-surface-variant">
                    {a.dueOn ? formatDate(a.dueOn, locale) : (a.note ?? t("common.noDate"))}
                  </span>
                </span>
                <AppointmentBadge state={a} locale={locale} />
                <span className="ml-auto flex flex-wrap items-center gap-1">
                  <Link
                    href={`/vaccines/appointments/${appointmentIds.get(key(a.productCode, a.doseNo)) ?? ""}/edit`}
                    className={BUTTON.text}
                  >
                    <Icon name="edit" size={18} />
                    {t("common.edit")}
                  </Link>
                  <Link
                    href={`/vaccines/record?product=${a.productCode}&dose=${String(a.doseNo)}`}
                    className={BUTTON.tonal}
                  >
                    <Icon name="check" size={18} />
                    {t("vaccines.given")}
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-0">
        <div className="px-4 pt-4 pb-2">
          <h2 className="title-medium">{t("vaccines.byDisease")}</h2>
          <p className="body-small mt-1 text-on-surface-variant">{t("vaccines.byDiseaseHint")}</p>
        </div>
        <ul className="divide-y divide-outline-variant">
          {view.covered.map((row) => (
            <li key={row.code} className="grid gap-x-4 gap-y-2 px-4 py-3 sm:grid-cols-[13rem_1fr]">
              <p className="flex items-baseline justify-between gap-3 sm:block">
                <span className="body-large">{row.name}</span>{" "}
                <span className="body-medium block whitespace-nowrap text-on-surface-variant">
                  {t("vaccines.doseCount", { n: row.doses.length })}
                </span>
              </p>
              <ul
                className="flex flex-wrap content-start items-start gap-2"
                aria-label={t("vaccines.dosesFor", { disease: row.name })}
              >
                {row.doses.map((d) => (
                  // A given dose is the normal state, so it stays quiet: an outlined chip with a
                  // green check. Strong color is kept for what needs action (overdue, upcoming).
                  <li
                    key={`${d.productCode}-${String(d.doseNo)}`}
                    className="label-large inline-flex h-8 items-center gap-1.5 rounded-m3-sm border border-outline-variant pr-3 pl-2 whitespace-nowrap text-on-surface"
                  >
                    <span className="text-success">
                      <Icon name="check" size={18} />
                    </span>
                    <span>
                      {d.productName} {d.doseNo}
                      <span className="tabular-nums text-on-surface-variant">
                        {" · "}
                        {formatDate(d.givenOn, locale)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        {view.uncovered.length > 0 && (
          <details className="body-medium border-t border-outline-variant px-4 py-3">
            <summary className="cursor-pointer text-on-surface-variant">
              {t("vaccines.uncovered", { n: view.uncovered.length })}
            </summary>
            <p className="mt-2 text-on-surface-variant">
              {view.uncovered.map((r) => r.name).join(" · ")}
            </p>
          </details>
        )}
      </Card>

      <Card className="p-0">
        <h2 id="history-title" className="title-medium px-4 pt-4 pb-2">
          {t("vaccines.history", { n: view.history.length })}
        </h2>
        <ol aria-labelledby="history-title" className="divide-y divide-outline-variant pb-2">
          {view.history.map((h) => (
            <li
              key={`${h.productCode}-${String(h.doseNo)}`}
              className="grid items-center gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[7rem_1fr_auto]"
            >
              <span className="body-medium tabular-nums text-on-surface-variant">
                {formatDate(h.givenOn, locale)}
              </span>
              <span>
                <span className="body-large">{h.productName}</span>
                <span className="text-on-surface-variant">
                  {" "}
                  · {t("common.dose", { n: h.doseNo })}
                </span>
                <span className="body-small block text-on-surface-variant">
                  {h.diseases.join(", ")}
                </span>
              </span>
              <span className="-ml-3 sm:ml-0">
                <DeleteForm
                  action={deleteDoseAction}
                  childId={child.id}
                  id={doseIds.get(key(h.productCode, h.doseNo)) ?? ""}
                  label={t("common.delete")}
                  title={t("vaccines.deleteDoseTitle", { product: h.productName, n: h.doseNo })}
                  confirm={t("vaccines.deleteDoseConfirm", { date: formatDate(h.givenOn, locale) })}
                />
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <p className="body-small text-on-surface-variant">{t("vaccines.footnote")}</p>
    </div>
  );
}
