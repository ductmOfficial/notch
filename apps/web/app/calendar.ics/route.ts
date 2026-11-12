import { listAppointments, listVaccinations } from "@notch/db";
import { appointmentStates } from "@notch/vaccines";

import { getCurrentChild } from "../../lib/child";
import { getDb } from "../../lib/db";
import { todayInVietnam } from "../../lib/format";
import { buildCalendar } from "../../lib/ics";

export const dynamic = "force-dynamic";

/**
 * One-off download of upcoming vaccination appointments for a calendar app.
 * Titles are generic on purpose: calendars sync to other services and show on
 * lock screens, so no child name or vaccine goes into the event.
 */
export async function GET(request: Request): Promise<Response> {
  const db = getDb();
  if (!db) return new Response("DATABASE_URL is not configured", { status: 503 });
  const { child } = await getCurrentChild(
    db,
    new URL(request.url).searchParams.get("child") ?? undefined,
  );
  if (!child) return new Response("No child", { status: 404 });

  const [doses, appointments] = await Promise.all([
    listVaccinations(db, child.id),
    listAppointments(db, child.id),
  ]);
  const ids = new Map(appointments.map((a) => [`${a.productCode}#${String(a.doseNo)}`, a.id]));
  const events = appointmentStates(appointments, doses, todayInVietnam())
    .filter((a) => (a.status === "today" || a.status === "upcoming") && a.dueOn !== null)
    .map((a) => ({
      uid: `${ids.get(`${a.productCode}#${String(a.doseNo)}`) ?? `${a.productCode}-${String(a.doseNo)}`}@notch`,
      date: a.dueOn ?? "",
      summary: "Lịch tiêm cho bé",
      description: "Mở Notch để xem mũi tiêm.",
    }));

  const body = buildCalendar(events, {
    name: "Notch · Lịch tiêm",
    now: new Date(),
    alarms: [
      { trigger: "-P6DT15H", text: "Còn 1 tuần tới lịch tiêm" },
      { trigger: "-PT15H", text: "Ngày mai có lịch tiêm" },
    ],
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="notch-lich-tiem.ics"',
      "Cache-Control": "no-store",
    },
  });
}
