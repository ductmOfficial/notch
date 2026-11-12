import { type Child, listMeasurements, type Measurement } from "@notch/db";
import type { Metadata } from "next";
import Link from "next/link";

import { BUTTON } from "../../components/button-styles";
import { CardLotus, type CardLotusProps } from "../../components/CardLotus";
import { GrowthChart } from "../../components/GrowthChart";
import { Icon } from "../../components/icons";
import { NoChild, NoDatabase } from "../../components/ui";
import { getCurrentChild } from "../../lib/child";
import { getDb } from "../../lib/db";
import type { Locale, Translate } from "../../lib/i18n/messages";
import { getI18n } from "../../lib/i18n/server";
import {
  formatAge,
  formatDate,
  formatNumber,
  formatZ,
  todayInVietnam,
  zBand,
} from "../../lib/format";
import {
  buildChart,
  type ChartIndicator,
  chartPoints,
  INDICATORS,
  isChartIndicator,
  type MeasurementInput,
} from "../../lib/growth-chart";

const GROWTH_LOTUS: Record<"weight" | "length" | "bmi", CardLotusProps> = {
  weight: { motif: "bloom", place: "bottomRight", tilt: -8 },
  length: { motif: "bud", place: "right", tilt: 22 },
  bmi: { motif: "petals", place: "topRight" },
};

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("growth.title") };
}
export const dynamic = "force-dynamic";

const TABS: readonly ChartIndicator[] = ["weight", "length", "bmi", "head"];

interface Props {
  readonly searchParams: Promise<{ indicator?: string | string[]; child?: string | string[] }>;
}

export default async function GrowthPage({ searchParams }: Props) {
  const params = await searchParams;
  const { t, locale } = await getI18n();
  const db = getDb();
  if (!db) return <NoDatabase />;
  const { children, child } = await getCurrentChild(db, params.child);
  if (!child) return <NoChild />;

  const indicator: ChartIndicator = isChartIndicator(params.indicator)
    ? params.indicator
    : "weight";
  const measurements = await listMeasurements(db, child.id);
  const chart = buildChart(indicator, child.sex, child.birthDate, measurements);
  const today = todayInVietnam();

  return (
    <div className="space-y-6 pt-2">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="headline-medium">{t("growth.heading", { name: child.name })}</h1>
          <p className="body-medium mt-1 text-on-surface-variant">
            {t("growth.subtitle", {
              sex: t(child.sex === "female" ? "common.female" : "common.male"),
              age: formatAge(child.birthDate, today, locale),
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {children.length > 1 && (
            <ChildPicker items={children} current={child.id} indicator={indicator} t={t} />
          )}
          <Link
            href={`/growth/new${children.length > 1 ? `?child=${child.id}` : ""}`}
            className={BUTTON.filled}
          >
            <Icon name="add" size={18} />
            {t("growth.add")}
          </Link>
        </div>
      </header>

      <Summary
        sex={child.sex}
        birthDate={child.birthDate}
        measurements={measurements}
        t={t}
        locale={locale}
      />

      <section aria-labelledby="chart-title" className="rounded-m3-md bg-surface-container-low p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="chart-title" className="title-medium">
            {t("growth.byAge", { indicator: t(INDICATORS[indicator].labelKey) })}
          </h2>
          <nav aria-label={t("growth.indicators")} className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <Link
                key={tab}
                href={`/growth?indicator=${tab}${children.length > 1 ? `&child=${child.id}` : ""}`}
                aria-current={tab === indicator ? "page" : undefined}
                className="state-layer label-large inline-flex h-8 items-center rounded-m3-sm border border-outline-variant px-3 text-on-surface-variant aria-[current=page]:border-transparent aria-[current=page]:bg-secondary-container aria-[current=page]:text-on-secondary-container"
              >
                {t(INDICATORS[tab].labelKey)}
              </Link>
            ))}
          </nav>
        </div>
        {chart.points.length === 0 ? (
          <p className="body-medium py-12 text-center text-on-surface-variant">
            {t("growth.noValues", { indicator: t(INDICATORS[indicator].labelKey).toLowerCase() })}
          </p>
        ) : (
          // On narrow screens the chart scrolls sideways. A right-to-left scroll
          // container starts scrolled to the end, where the latest measurements
          // are, without client JavaScript. The inner box must be as wide as the chart
          // (w-max) so it overflows to the left; the content stays left-to-right.
          <div
            dir="rtl"
            // Focusable so the chart can be scrolled with the keyboard when it overflows.
            tabIndex={0}
            role="region"
            aria-labelledby="chart-title"
            className="-mx-4 overflow-x-auto px-4"
          >
            <div dir="ltr" className="w-max min-w-full">
              <GrowthChart chart={chart} titleId="chart-title" locale={locale} />
            </div>
          </div>
        )}
        <Legend t={t} />
      </section>

      <MeasurementTable
        sex={child.sex}
        birthDate={child.birthDate}
        measurements={measurements}
        t={t}
        locale={locale}
      />

      <p className="body-small text-on-surface-variant">{t("growth.disclaimer")}</p>
    </div>
  );
}

function ChildPicker({
  items,
  current,
  indicator,
  t,
}: {
  items: Child[];
  current: string;
  indicator: ChartIndicator;
  t: Translate;
}) {
  return (
    <nav aria-label={t("growth.pickChild")} className="flex gap-2">
      {items.map((c) => (
        <Link
          key={c.id}
          href={`/growth?indicator=${indicator}&child=${c.id}`}
          aria-current={c.id === current ? "page" : undefined}
          className="state-layer label-large inline-flex h-8 items-center rounded-m3-sm border border-outline-variant px-3 text-on-surface-variant aria-[current=page]:border-transparent aria-[current=page]:bg-secondary-container aria-[current=page]:text-on-secondary-container"
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}

function Summary({
  sex,
  birthDate,
  measurements,
  t,
  locale,
}: {
  sex: Child["sex"];
  birthDate: string;
  measurements: MeasurementInput[];
  t: Translate;
  locale: Locale;
}) {
  const cards = (["weight", "length", "bmi"] as const).flatMap((indicator) => {
    const latest = chartPoints(indicator, sex, birthDate, measurements).at(-1);
    return latest ? [{ indicator, latest }] : [];
  });
  if (cards.length === 0) return null;

  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      {cards.map(({ indicator, latest }) => {
        const info = INDICATORS[indicator];
        return (
          <div
            key={indicator}
            className="relative isolate overflow-hidden rounded-m3-md bg-surface-container-highest p-4"
          >
            <CardLotus {...GROWTH_LOTUS[indicator]} />
            <dt className="title-small text-on-surface-variant">{t(info.labelKey)}</dt>
            <dd className="mt-1">
              <span className="headline-medium tabular-nums">
                {latest.estimated ? "≈" : ""}
                {formatNumber(latest.value, info.digits, locale)}
              </span>{" "}
              <span className="body-medium text-on-surface-variant">{info.unit}</span>
            </dd>
            {latest.z !== undefined && latest.percentile !== undefined && (
              <dd className="body-medium mt-1">
                {t("growth.percentile")}{" "}
                <strong className="tabular-nums">{Math.round(latest.percentile)}</strong> · z{" "}
                <span className="tabular-nums">{formatZ(latest.z, locale)}</span>
                <span className="body-small block text-on-surface-variant">
                  {zBand(latest.z, locale)}
                </span>
              </dd>
            )}
            <dd className="body-small mt-1 text-on-surface-variant">
              {t("growth.measuredOn", { date: formatDate(latest.date, locale) })}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function Legend({ t }: { t: Translate }) {
  const items = [
    {
      label: t("growth.legendMedian"),
      style: { borderColor: "var(--chart-median)", borderTopWidth: 2 },
    },
    { label: "±2 SD", style: { borderColor: "var(--chart-sd2)", borderTopWidth: 2 } },
    {
      label: "±3 SD",
      style: {
        borderColor: "var(--chart-sd3)",
        borderTopWidth: 2,
        borderTopStyle: "dashed" as const,
      },
    },
    {
      label: t("growth.legendChild"),
      style: { borderColor: "var(--chart-point)", borderTopWidth: 3 },
    },
  ];
  return (
    <ul className="body-small mt-3 flex flex-wrap gap-x-5 gap-y-1 text-on-surface-variant">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block w-5" style={item.style} />
          {item.label}
        </li>
      ))}
      <li>{t("growth.legendEstimated")}</li>
    </ul>
  );
}

function MeasurementTable({
  sex,
  birthDate,
  measurements,
  t,
  locale,
}: {
  sex: Child["sex"];
  birthDate: string;
  measurements: Measurement[];
  t: Translate;
  locale: Locale;
}) {
  const weight = new Map(
    chartPoints("weight", sex, birthDate, measurements).map((p) => [p.date, p]),
  );
  const length = new Map(
    chartPoints("length", sex, birthDate, measurements).map((p) => [p.date, p]),
  );
  const rows = measurements.toReversed();
  const cell = (p: ReturnType<typeof weight.get>, digits: number) =>
    p ? (
      <>
        {p.estimated ? "≈" : ""}
        {formatNumber(p.value, digits, locale)}
        {p.percentile !== undefined && (
          <span className="body-small ml-2 text-on-surface-variant">
            P{Math.round(p.percentile)}
          </span>
        )}
      </>
    ) : (
      "—"
    );

  return (
    <section aria-labelledby="table-title" className="rounded-m3-md bg-surface-container-low p-4">
      <h2 id="table-title" className="title-medium mb-2">
        {t("growth.measurements", { n: measurements.length })}
      </h2>
      <div className="overflow-x-auto">
        <table className="body-medium w-full">
          <thead className="label-large text-left text-on-surface-variant">
            <tr>
              <th scope="col" className="py-2 pr-4 font-medium">
                {t("growth.colDate")}
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                {t("growth.colAge")}
              </th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">
                {t("growth.colWeight")}
              </th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">
                {t("growth.colLength")}
              </th>
              <th scope="col" className="py-2">
                <span className="sr-only">{t("growth.colActions")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((m) => (
              <tr key={m.id} className="border-t border-outline-variant">
                <td className="py-1 pr-4 whitespace-nowrap">{formatDate(m.measuredOn, locale)}</td>
                <td className="py-1 pr-4 whitespace-nowrap text-on-surface-variant">
                  {formatAge(birthDate, m.measuredOn, locale)}
                </td>
                <td className="py-1 pr-4 text-right whitespace-nowrap">
                  {cell(weight.get(m.measuredOn), 2)}
                </td>
                <td className="py-1 pr-4 text-right whitespace-nowrap">
                  {cell(length.get(m.measuredOn), 1)}
                </td>
                <td className="py-1 text-right">
                  <Link
                    href={`/growth/${m.id}/edit`}
                    className={BUTTON.text}
                    aria-label={t("growth.editRow", { date: formatDate(m.measuredOn, locale) })}
                  >
                    <Icon name="edit" size={18} />
                    {t("common.edit")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
