import { listAppointments, listVaccinations } from "@notch/db";
import type { Metadata } from "next";

import { AppointmentBadge } from "../../components/AppointmentBadge";
import { Card, NoChild, NoDatabase } from "../../components/ui";
import { getCurrentChild } from "../../lib/child";
import { getDb } from "../../lib/db";
import { formatAge, formatDate, todayInVietnam } from "../../lib/format";
import { buildVaccinationView, productName } from "../../lib/vaccines-view";

export const metadata: Metadata = { title: "Tiêm chủng" };
export const dynamic = "force-dynamic";

interface Props {
  readonly searchParams: Promise<{ child?: string | string[] }>;
}

export default async function VaccinesPage({ searchParams }: Props) {
  const params = await searchParams;
  const db = getDb();
  if (!db) return <NoDatabase />;
  const { child } = await getCurrentChild(db, params.child);
  if (!child) return <NoChild />;

  const [doses, appointments] = await Promise.all([
    listVaccinations(db, child.id),
    listAppointments(db, child.id),
  ]);
  const today = todayInVietnam();
  const view = buildVaccinationView(doses, appointments, today);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Tiêm chủng của {child.name}</h1>
        <p className="text-sm text-[var(--muted)]">
          {formatAge(child.birthDate, today)} · {doses.length} mũi đã tiêm · {view.covered.length}/
          {view.covered.length + view.uncovered.length} bệnh đã có mũi
        </p>
      </header>

      <Card>
        <h2 className="mb-3 font-medium">Lịch hẹn</h2>
        {view.open.length === 0 && view.undated.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Không có lịch hẹn nào đang chờ.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {[...view.open, ...view.undated].map((a) => (
              <li
                key={`${a.productCode}-${String(a.doseNo)}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5"
              >
                <span className="min-w-40 font-medium">
                  {productName(a.productCode)}{" "}
                  <span className="font-normal text-[var(--muted)]">· mũi {a.doseNo}</span>
                </span>
                <span className="text-sm tabular-nums text-[var(--muted)]">
                  {a.dueOn ? formatDate(a.dueOn) : (a.note ?? "Chưa có ngày")}
                </span>
                <span className="ml-auto">
                  <AppointmentBadge state={a} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-1 font-medium">Theo bệnh</h2>
        <p className="mb-3 text-xs text-[var(--muted)]">
          Một mũi vaccine phối hợp được tính cho mọi bệnh nó phòng (ví dụ Infanrix Hexa phòng 6
          bệnh).
        </p>
        <ul className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {view.covered.map((row) => (
            <li key={row.code} className="grid gap-x-4 gap-y-1.5 py-2.5 sm:grid-cols-[13rem_1fr]">
              <p className="flex items-baseline justify-between gap-3 sm:block">
                <span className="font-medium">{row.name}</span>{" "}
                <span className="text-sm whitespace-nowrap text-[var(--muted)]">
                  {row.doses.length} mũi
                </span>
              </p>
              <ul
                className="flex flex-wrap content-start items-start gap-1.5"
                aria-label={`Các mũi phòng ${row.name}`}
              >
                {row.doses.map((d) => (
                  <li
                    key={`${d.productCode}-${String(d.doseNo)}`}
                    className="rounded-md bg-[var(--grid)] px-2 py-0.5 text-xs whitespace-nowrap"
                  >
                    {d.productName} {d.doseNo} ·{" "}
                    <span className="tabular-nums">{formatDate(d.givenOn)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        {view.uncovered.length > 0 && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-[var(--muted)]">
              Chưa có mũi nào ({view.uncovered.length} bệnh)
            </summary>
            <p className="mt-2 text-[var(--muted)]">
              {view.uncovered.map((r) => r.name).join(" · ")}
            </p>
          </details>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Lịch sử tiêm ({view.history.length})</h2>
        <ol className="divide-y divide-[var(--border)]">
          {view.history.map((h) => (
            <li
              key={`${h.productCode}-${String(h.doseNo)}`}
              className="grid gap-x-4 py-2.5 sm:grid-cols-[7rem_1fr]"
            >
              <span className="text-sm tabular-nums text-[var(--muted)]">
                {formatDate(h.givenOn)}
              </span>
              <span>
                <span className="font-medium">{h.productName}</span>{" "}
                <span className="text-[var(--muted)]">· mũi {h.doseNo}</span>
                <span className="block text-xs text-[var(--muted)]">{h.diseases.join(", ")}</span>
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <p className="text-xs text-[var(--muted)]">
        Lịch hẹn theo sổ tiêm của phòng tiêm. Hỏi bác sĩ hoặc phòng tiêm trước khi thay đổi lịch.
      </p>
    </div>
  );
}
