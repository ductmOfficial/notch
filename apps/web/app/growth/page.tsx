import { type Child, listMeasurements, type Measurement } from "@notch/db";
import type { Metadata } from "next";
import Link from "next/link";

import { GrowthChart } from "../../components/GrowthChart";
import { NoChild, NoDatabase } from "../../components/ui";
import { getCurrentChild } from "../../lib/child";
import { getDb } from "../../lib/db";
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

export const metadata: Metadata = { title: "Tăng trưởng" };
export const dynamic = "force-dynamic";

const TABS: readonly ChartIndicator[] = ["weight", "length", "bmi", "head"];

interface Props {
  readonly searchParams: Promise<{ indicator?: string | string[]; child?: string | string[] }>;
}

export default async function GrowthPage({ searchParams }: Props) {
  const params = await searchParams;
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
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tăng trưởng của {child.name}</h1>
          <p className="text-sm text-[var(--muted)]">
            {child.sex === "female" ? "Bé gái" : "Bé trai"} · {formatAge(child.birthDate, today)} ·
            so với chuẩn WHO
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {children.length > 1 && (
            <ChildPicker items={children} current={child.id} indicator={indicator} />
          )}
          <Link
            href={`/growth/new${children.length > 1 ? `?child=${child.id}` : ""}`}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--surface)] hover:opacity-90"
          >
            Thêm lần đo
          </Link>
        </div>
      </header>

      <Summary sex={child.sex} birthDate={child.birthDate} measurements={measurements} />

      <section
        aria-labelledby="chart-title"
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="chart-title" className="font-medium">
            {INDICATORS[indicator].label} theo tuổi
          </h2>
          <nav aria-label="Chỉ số" className="flex flex-wrap gap-1">
            {TABS.map((tab) => (
              <Link
                key={tab}
                href={`/growth?indicator=${tab}${children.length > 1 ? `&child=${child.id}` : ""}`}
                aria-current={tab === indicator ? "page" : undefined}
                className="rounded-full px-3 py-1 text-sm text-[var(--muted)] hover:text-[var(--text)] aria-[current=page]:bg-[var(--accent-soft)] aria-[current=page]:text-[var(--accent)]"
              >
                {INDICATORS[tab].label}
              </Link>
            ))}
          </nav>
        </div>
        {chart.points.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--muted)]">
            Chưa có số đo {INDICATORS[indicator].label.toLowerCase()}.
          </p>
        ) : (
          // On narrow screens the chart scrolls sideways. A right-to-left scroll
          // container starts scrolled to the end, where the latest measurements
          // are, without client JavaScript. The inner box must be as wide as the chart
          // (w-max) so it overflows to the left; the content stays left-to-right.
          <div dir="rtl" className="-mx-4 overflow-x-auto px-4">
            <div dir="ltr" className="w-max min-w-full">
              <GrowthChart chart={chart} titleId="chart-title" />
            </div>
          </div>
        )}
        <Legend />
      </section>

      <MeasurementTable sex={child.sex} birthDate={child.birthDate} measurements={measurements} />

      <p className="text-xs text-[var(--muted)]">
        Số liệu đối chiếu với Chuẩn tăng trưởng trẻ em của WHO (0–5 tuổi). Đây không phải đánh giá y
        khoa; hãy hỏi bác sĩ khi có điều cần lưu ý.
      </p>
    </div>
  );
}

function ChildPicker({
  items,
  current,
  indicator,
}: {
  items: Child[];
  current: string;
  indicator: ChartIndicator;
}) {
  return (
    <nav aria-label="Chọn bé" className="flex gap-1">
      {items.map((c) => (
        <Link
          key={c.id}
          href={`/growth?indicator=${indicator}&child=${c.id}`}
          aria-current={c.id === current ? "page" : undefined}
          className="rounded-full border border-[var(--border)] px-3 py-1 text-sm aria-[current=page]:bg-[var(--accent-soft)]"
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
}: {
  sex: Child["sex"];
  birthDate: string;
  measurements: MeasurementInput[];
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
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <dt className="text-sm text-[var(--muted)]">{info.label}</dt>
            <dd className="mt-1">
              <span className="text-2xl font-semibold tabular-nums">
                {latest.estimated ? "≈" : ""}
                {formatNumber(latest.value, info.digits)}
              </span>{" "}
              <span className="text-sm text-[var(--muted)]">{info.unit}</span>
            </dd>
            {latest.z !== undefined && latest.percentile !== undefined && (
              <dd className="mt-1 text-sm">
                Bách phân vị{" "}
                <strong className="tabular-nums">{Math.round(latest.percentile)}</strong> · z{" "}
                <span className="tabular-nums">{formatZ(latest.z)}</span>
                <span className="block text-xs text-[var(--muted)]">{zBand(latest.z)}</span>
              </dd>
            )}
            <dd className="mt-1 text-xs text-[var(--muted)]">Đo ngày {formatDate(latest.date)}</dd>
          </div>
        );
      })}
    </dl>
  );
}

function Legend() {
  const items = [
    { label: "Trung bình (TB)", style: { borderColor: "var(--curve-median)", borderTopWidth: 2 } },
    { label: "±2 SD", style: { borderColor: "var(--curve-2)", borderTopWidth: 2 } },
    {
      label: "±3 SD",
      style: {
        borderColor: "var(--curve-3)",
        borderTopWidth: 2,
        borderTopStyle: "dashed" as const,
      },
    },
    { label: "Số đo của bé", style: { borderColor: "var(--point)", borderTopWidth: 3 } },
  ];
  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--muted)]">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block w-5" style={item.style} />
          {item.label}
        </li>
      ))}
      <li>Chấm rỗng: số đo ước lượng</li>
    </ul>
  );
}

function MeasurementTable({
  sex,
  birthDate,
  measurements,
}: {
  sex: Child["sex"];
  birthDate: string;
  measurements: Measurement[];
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
        {formatNumber(p.value, digits)}
        {p.percentile !== undefined && (
          <span className="ml-2 text-xs text-[var(--muted)]">P{Math.round(p.percentile)}</span>
        )}
      </>
    ) : (
      "—"
    );

  return (
    <section
      aria-labelledby="table-title"
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <h2 id="table-title" className="mb-3 font-medium">
        Các lần đo ({measurements.length})
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[var(--muted)]">
            <tr>
              <th scope="col" className="py-2 pr-4 font-normal">
                Ngày
              </th>
              <th scope="col" className="py-2 pr-4 font-normal">
                Tuổi
              </th>
              <th scope="col" className="py-2 pr-4 text-right font-normal">
                Cân nặng (kg)
              </th>
              <th scope="col" className="py-2 pr-4 text-right font-normal">
                Chiều dài (cm)
              </th>
              <th scope="col" className="py-2">
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((m) => (
              <tr key={m.id} className="border-t border-[var(--border)]">
                <td className="py-2 pr-4 whitespace-nowrap">{formatDate(m.measuredOn)}</td>
                <td className="py-2 pr-4 whitespace-nowrap text-[var(--muted)]">
                  {formatAge(birthDate, m.measuredOn)}
                </td>
                <td className="py-2 pr-4 text-right whitespace-nowrap">
                  {cell(weight.get(m.measuredOn), 2)}
                </td>
                <td className="py-2 pr-4 text-right whitespace-nowrap">
                  {cell(length.get(m.measuredOn), 1)}
                </td>
                <td className="py-2 text-right">
                  <Link
                    href={`/growth/${m.id}/edit`}
                    className="text-[var(--accent)] hover:underline"
                    aria-label={`Sửa lần đo ${formatDate(m.measuredOn)}`}
                  >
                    Sửa
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
