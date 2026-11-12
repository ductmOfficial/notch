import { listAppointments, listMeasurements, listVaccinations } from "@notch/db";
import type { Metadata } from "next";
import Link from "next/link";

import { AppointmentBadge } from "../components/AppointmentBadge";
import { Icon } from "../components/icons";
import { Card, NoChild, NoDatabase } from "../components/ui";
import { getCurrentChild } from "../lib/child";
import { getDb } from "../lib/db";
import { getI18n } from "../lib/i18n/server";
import { formatAge, formatDate, formatNumber, formatZ, todayInVietnam, zBand } from "../lib/format";
import { chartPoints, INDICATORS } from "../lib/growth-chart";
import { buildVaccinationView, dueLabel, productName } from "../lib/vaccines-view";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("nav.today") };
}
export const dynamic = "force-dynamic";

interface Props {
  readonly searchParams: Promise<{ child?: string | string[] }>;
}

export default async function TodayPage({ searchParams }: Props) {
  const params = await searchParams;
  const { t, locale } = await getI18n();
  const db = getDb();
  if (!db) return <NoDatabase />;
  const { child } = await getCurrentChild(db, params.child);
  if (!child) return <NoChild />;

  const [measurements, doses, appointments] = await Promise.all([
    listMeasurements(db, child.id),
    listVaccinations(db, child.id),
    listAppointments(db, child.id),
  ]);
  const today = todayInVietnam();
  const view = buildVaccinationView(doses, appointments, today, undefined, locale);
  const next = view.next;
  const later = view.open.filter((a) => a !== next).slice(0, 3);
  const overdue = view.open.filter((a) => a.status === "overdue").length;
  const latest = (["weight", "length"] as const).flatMap((indicator) => {
    const point = chartPoints(indicator, child.sex, child.birthDate, measurements).at(-1);
    return point ? [{ indicator, point }] : [];
  });
  const lastDate = measurements.at(-1)?.measuredOn;

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <p className="body-medium text-on-surface-variant">
          {t("today.date", { date: formatDate(today, locale) })}
        </p>
        <h1 className="headline-medium mt-1">
          {t("today.heading", { name: child.name, age: formatAge(child.birthDate, today, locale) })}
        </h1>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <Card
          tone={next?.status === "overdue" ? "error" : "primary"}
          className="flex flex-col gap-4 p-5 md:col-span-2 md:row-span-2"
        >
          <h2 className="title-small flex items-center gap-2">
            <Icon name="vaccines" size={20} />
            {t("today.nextAppointment")}
          </h2>
          {next ? (
            <>
              <div>
                <p className="headline-small">
                  {productName(next.productCode)}
                  <span className="opacity-80"> · {t("common.dose", { n: next.doseNo })}</span>
                </p>
                <p className="body-large mt-1 tabular-nums">
                  {next.dueOn ? formatDate(next.dueOn, locale) : t("common.noDate")}
                </p>
              </div>
              <p className="display-small tabular-nums">{dueLabel(next, locale)}</p>
              {later.length > 0 && (
                <ul className="mt-auto divide-y divide-outline-variant rounded-m3-md bg-surface/60 text-on-surface">
                  {later.map((a) => (
                    <li
                      key={`${a.productCode}-${String(a.doseNo)}`}
                      className="body-medium flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <span>
                        {productName(a.productCode)}
                        <span className="text-on-surface-variant">
                          {" "}
                          · {t("common.dose", { n: a.doseNo })}
                        </span>
                      </span>
                      <AppointmentBadge state={a} locale={locale} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="body-large">{t("today.noAppointments")}</p>
          )}
          <Link
            href="/vaccines"
            className="state-layer label-large -mx-3 inline-flex h-10 w-fit items-center gap-1 rounded-full px-3"
          >
            {t("today.seeVaccines")}
            <Icon name="chevronRight" size={18} />
          </Link>
        </Card>

        {latest.map(({ indicator, point }) => {
          const info = INDICATORS[indicator];
          return (
            <Card key={indicator} tone="filled" className="flex flex-col gap-2 p-5">
              <h2 className="title-small flex items-center gap-2 text-on-surface-variant">
                <Icon name={indicator === "weight" ? "scale" : "straighten"} size={20} />
                {t(info.labelKey)}
              </h2>
              <p className="display-small tabular-nums">
                {point.estimated ? "≈" : ""}
                {formatNumber(point.value, info.digits, locale)}
                <span className="title-medium text-on-surface-variant"> {info.unit}</span>
              </p>
              {point.z !== undefined && point.percentile !== undefined && (
                <p className="body-medium text-on-surface-variant">
                  P{Math.round(point.percentile)} · z {formatZ(point.z, locale)} ·{" "}
                  {zBand(point.z, locale)}
                </p>
              )}
            </Card>
          );
        })}

        <Card tone="outlined" className="flex flex-col gap-2 p-5 md:col-span-2">
          <h2 className="title-small text-on-surface-variant">{t("today.vaccinations")}</h2>
          <p className="body-large">
            {t("today.vaccinationSummary", { doses: view.history.length, open: view.open.length })}
            {overdue > 0 ? t("today.overdueCount", { n: overdue }) : ""}
          </p>
        </Card>

        <Card tone="outlined" className="flex flex-col justify-between gap-2 p-5">
          <h2 className="title-small text-on-surface-variant">{t("today.lastMeasurement")}</h2>
          <p className="body-large">
            {lastDate ? formatDate(lastDate, locale) : t("today.noMeasurements")}
          </p>
          <Link
            href="/growth"
            className="state-layer label-large -mx-3 inline-flex h-10 w-fit items-center gap-1 rounded-full px-3 text-primary"
          >
            {t("today.seeChart")}
            <Icon name="chevronRight" size={18} />
          </Link>
        </Card>
      </div>
    </div>
  );
}
