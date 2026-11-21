import { type Child, listMeasurements, type Measurement } from "@notch/db";
import type { GrowthLevel } from "@notch/growth";
import type { Metadata } from "next";
import Link from "next/link";

import { BUTTON } from "../../components/button-styles";
import { CardMotif, type CardMotifProps } from "../../components/Motifs";
import { GrowthChart } from "../../components/GrowthChart";
import { GrowthReadingView } from "../../components/GrowthReading";
import { Icon } from "../../components/icons";
import { NoChild, NoDatabase } from "../../components/ui";
import { getCurrentChild } from "../../lib/child";
import { getDb } from "../../lib/db";
import type { Locale, Translate } from "../../lib/i18n/messages";
import { getI18n } from "../../lib/i18n/server";
import { formatAge, formatDate, formatNumber, formatZ, todayInVietnam } from "../../lib/format";
import { chartSubtitle, readGrowth } from "../../lib/growth-assessment";
import {
  buildChart,
  type ChartIndicator,
  chartPoints,
  INDICATORS,
  type MeasurementInput,
} from "../../lib/growth-chart";

/**
 * Summary grid columns by number of cards, so the cards always fill the row (a child
 * measured only for weight has one). Written out in full for Tailwind to find them.
 */
const SUMMARY_COLUMNS: Record<number, string> = {
  1: "",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
};

const GROWTH_MOTIFS: Record<"weight" | "length" | "bmi", CardMotifProps> = {
  weight: { kind: "bloom", place: "bottomRight", tilt: -8 },
  length: { kind: "bud", place: "right", tilt: 22 },
  bmi: { kind: "petals", place: "topRight" },
};

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("growth.title") };
}
export const dynamic = "force-dynamic";

const CHARTS: readonly ChartIndicator[] = ["weight", "length", "bmi"];

/** Level of a reading as a text colour; "watch" stays neutral but bold. */
const LEVEL_TEXT: Record<GrowthLevel, string> = {
  normal: "text-success",
  watch: "text-on-surface",
  doctor: "text-error",
};

interface Props {
  readonly searchParams: Promise<{ child?: string | string[] }>;
}

export default async function GrowthPage({ searchParams }: Props) {
  const params = await searchParams;
  const { t, locale } = await getI18n();
  const db = getDb();
  if (!db) return <NoDatabase />;
  const { children, child } = await getCurrentChild(db, params.child);
  if (!child) return <NoChild />;

  const measurements = await listMeasurements(db, child.id);
  const charts = CHARTS.map((indicator) => ({
    indicator,
    chart: buildChart(indicator, child.sex, child.birthDate, measurements),
    subtitle: chartSubtitle(
      indicator,
      child.sex,
      child.birthDate,
      chartPoints(indicator, child.sex, child.birthDate, measurements),
      locale,
    ),
  }));
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
          {children.length > 1 && <ChildPicker items={children} current={child.id} t={t} />}
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

      <div className="grid gap-3 xl:grid-cols-3">
        {charts.map(({ indicator, chart, subtitle }) => {
          const titleId = `chart-${indicator}`;
          return (
            <section
              key={indicator}
              aria-labelledby={titleId}
              // min-w-0: a grid item otherwise grows to the chart's minimum width and the page
              // scrolls sideways on phones; the chart's own scroll box should take the overflow.
              className="flex min-w-0 flex-col rounded-m3-md bg-surface-container-low p-4"
            >
              <h2 id={titleId} className="title-medium">
                {t("growth.byAge", { indicator: t(INDICATORS[indicator].labelKey) })}
              </h2>
              <p className="body-medium mt-1 mb-3 text-on-surface-variant">
                {subtitle.label && subtitle.level && (
                  <>
                    <strong className={`font-medium ${LEVEL_TEXT[subtitle.level]}`}>
                      {subtitle.label}
                    </strong>
                    {" · "}
                  </>
                )}
                {subtitle.detail}
              </p>
              {chart.points.length > 0 && (
                <>
                  {/*
                   * Below xl the card is full width: the wide frame, scrolling sideways on
                   * phones. A right-to-left scroll container starts scrolled to the end, where
                   * the latest measurements are, without client JavaScript; the inner box is
                   * as wide as the chart (w-max) so it overflows to the left.
                   */}
                  <div
                    dir="rtl"
                    // Focusable so the chart can be scrolled with the keyboard when it overflows.
                    tabIndex={0}
                    role="region"
                    aria-labelledby={titleId}
                    className="-mx-4 overflow-x-auto px-4 xl:hidden"
                  >
                    <div dir="ltr" className="w-max min-w-full">
                      <GrowthChart chart={chart} titleId={titleId} locale={locale} />
                    </div>
                  </div>
                  {/* From xl, three cards share the row: the compact frame, without scrolling. */}
                  <div className="-mx-2 mt-auto hidden xl:block">
                    <GrowthChart chart={chart} titleId={titleId} locale={locale} size="compact" />
                  </div>
                </>
              )}
            </section>
          );
        })}
      </div>
      <Legend t={t} />

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

function ChildPicker({ items, current, t }: { items: Child[]; current: string; t: Translate }) {
  return (
    <nav aria-label={t("growth.pickChild")} className="flex gap-2">
      {items.map((c) => (
        <Link
          key={c.id}
          href={`/growth?child=${c.id}`}
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
    const points = chartPoints(indicator, sex, birthDate, measurements);
    const latest = points.at(-1);
    return latest
      ? [{ indicator, latest, reading: readGrowth(indicator, sex, birthDate, points, locale) }]
      : [];
  });
  if (cards.length === 0) return null;

  return (
    <dl className={`grid gap-3 ${SUMMARY_COLUMNS[cards.length] ?? ""}`}>
      {cards.map(({ indicator, latest, reading }) => {
        const info = INDICATORS[indicator];
        return (
          <div
            key={indicator}
            className="relative isolate overflow-hidden rounded-m3-md bg-surface-container-highest p-4"
          >
            <CardMotif {...GROWTH_MOTIFS[indicator]} />
            <dt className="title-small text-on-surface-variant">{t(info.labelKey)}</dt>
            <dd className="mt-1">
              <span className="headline-medium tabular-nums">
                {latest.estimated ? "≈" : ""}
                {formatNumber(latest.value, info.digits, locale)}
              </span>{" "}
              <span className="body-medium text-on-surface-variant">{info.unit}</span>
            </dd>
            {reading && (
              <dd className="mt-2">
                <GrowthReadingView reading={reading} />
              </dd>
            )}
            {latest.z !== undefined && latest.percentile !== undefined && (
              <dd className="body-small mt-1 text-on-surface-variant">
                {t("growth.percentile")}{" "}
                <span className="tabular-nums">{Math.round(latest.percentile)}</span> · z{" "}
                <span className="tabular-nums">{formatZ(latest.z, locale)}</span>
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
