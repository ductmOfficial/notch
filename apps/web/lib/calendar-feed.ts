import "server-only";

import { type Child, type Db, listAppointments, listVaccinations } from "@notch/db";
import { appointmentStates } from "@notch/vaccines";

import { todayInVietnam } from "./format";
import type { Translate } from "./i18n/messages";
import { buildCalendar, type CalendarEvent } from "./ics";

/**
 * Upcoming vaccination appointments of the given children as an iCalendar file. Titles are
 * generic on purpose: calendars sync to other services and show on lock screens, so no
 * child name or vaccine goes into an event.
 */
export async function vaccinationCalendar(
  db: Db,
  children: readonly Child[],
  t: Translate,
): Promise<string> {
  const today = todayInVietnam();
  const events: CalendarEvent[] = [];
  for (const child of children) {
    const [doses, appointments] = await Promise.all([
      listVaccinations(db, child.id),
      listAppointments(db, child.id),
    ]);
    const ids = new Map(appointments.map((a) => [`${a.productCode}#${String(a.doseNo)}`, a.id]));
    for (const a of appointmentStates(appointments, doses, today)) {
      if ((a.status !== "today" && a.status !== "upcoming") || a.dueOn === null) continue;
      const key = `${a.productCode}#${String(a.doseNo)}`;
      events.push({
        uid: `${ids.get(key) ?? `${child.id}-${a.productCode}-${String(a.doseNo)}`}@notch`,
        date: a.dueOn,
        summary: t("calendar.summary"),
        description: t("calendar.description"),
      });
    }
  }
  return buildCalendar(events, {
    name: t("calendar.name"),
    now: new Date(),
    alarms: [
      { trigger: "-P6DT15H", text: t("calendar.weekBefore") },
      { trigger: "-PT15H", text: t("calendar.dayBefore") },
    ],
  });
}
