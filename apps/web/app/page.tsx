import { listAppointments, listMeasurements, listVaccinations } from "@notch/db";
import type { Metadata } from "next";
import Link from "next/link";

import { AppointmentBadge } from "../components/AppointmentBadge";
import { Card, NoChild, NoDatabase } from "../components/ui";
import { getCurrentChild } from "../lib/child";
import { getDb } from "../lib/db";
import { formatAge, formatDate, formatNumber, formatZ, todayInVietnam, zBand } from "../lib/format";
import { chartPoints, INDICATORS } from "../lib/growth-chart";
import { buildVaccinationView, productName } from "../lib/vaccines-view";

export const metadata: Metadata = { title: "Hôm nay" };
export const dynamic = "force-dynamic";

interface Props {
  readonly searchParams: Promise<{ child?: string | string[] }>;
}

export default async function TodayPage({ searchParams }: Props) {
  const params = await searchParams;
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
  const view = buildVaccinationView(doses, appointments, today);
  const next = view.next;
  const later = view.open.filter((a) => a !== next).slice(0, 3);
  const latest = (["weight", "length"] as const).flatMap((indicator) => {
    const point = chartPoints(indicator, child.sex, child.birthDate, measurements).at(-1);
    return point ? [{ indicator, point }] : [];
  });
  const lastDate = measurements.at(-1)?.measuredOn;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-[var(--muted)]">Hôm nay, {formatDate(today)}</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {child.name} được {formatAge(child.birthDate, today)}
        </h1>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm text-[var(--muted)]">Lịch hẹn tiêm tiếp theo</h2>
          {next ? (
            <>
              <p className="text-xl font-semibold">
                {productName(next.productCode)}{" "}
                <span className="font-normal text-[var(--muted)]">· mũi {next.doseNo}</span>
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="tabular-nums">
                  {next.dueOn ? formatDate(next.dueOn) : "Chưa có ngày"}
                </span>
                <AppointmentBadge state={next} />
              </p>
              {later.length > 0 && (
                <ul className="mt-4 space-y-1.5 border-t border-[var(--border)] pt-3 text-sm">
                  {later.map((a) => (
                    <li
                      key={`${a.productCode}-${String(a.doseNo)}`}
                      className="flex justify-between gap-3"
                    >
                      <span>
                        {productName(a.productCode)}{" "}
                        <span className="text-[var(--muted)]">· mũi {a.doseNo}</span>
                      </span>
                      <span className="tabular-nums text-[var(--muted)]">
                        {a.dueOn ? formatDate(a.dueOn) : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">Không có lịch hẹn nào đang chờ.</p>
          )}
          <Link
            href="/vaccines"
            className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline"
          >
            Xem lịch tiêm →
          </Link>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm text-[var(--muted)]">
            Lần đo gần nhất{lastDate ? ` · ${formatDate(lastDate)}` : ""}
          </h2>
          {latest.length > 0 ? (
            <dl className="grid grid-cols-2 gap-4">
              {latest.map(({ indicator, point }) => {
                const info = INDICATORS[indicator];
                return (
                  <div key={indicator}>
                    <dt className="text-sm text-[var(--muted)]">{info.label}</dt>
                    <dd className="text-xl font-semibold tabular-nums">
                      {point.estimated ? "≈" : ""}
                      {formatNumber(point.value, info.digits)}{" "}
                      <span className="text-sm font-normal text-[var(--muted)]">{info.unit}</span>
                    </dd>
                    {point.z !== undefined && point.percentile !== undefined && (
                      <dd className="text-sm">
                        P{Math.round(point.percentile)} · z{" "}
                        <span className="tabular-nums">{formatZ(point.z)}</span>
                        <span className="block text-xs text-[var(--muted)]">{zBand(point.z)}</span>
                      </dd>
                    )}
                  </div>
                );
              })}
            </dl>
          ) : (
            <p className="text-sm text-[var(--muted)]">Chưa có lần đo nào.</p>
          )}
          <Link
            href="/growth"
            className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline"
          >
            Xem biểu đồ tăng trưởng →
          </Link>
        </Card>
      </div>
    </div>
  );
}
