import { addChild, createDb, saveAppointment, schema, syncCatalog } from "@notch/db";
import { CATALOG } from "@notch/vaccines";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { vaccinationCalendar } from "./calendar-feed";
import { todayInVietnam } from "./format";
import { translator } from "./i18n/messages";

const handle = createDb("pglite:memory");

beforeAll(async () => {
  await handle.migrate();
  await syncCatalog(handle.db, CATALOG);
});

afterAll(async () => {
  await handle.close();
});

const inDays = (days: number) =>
  new Date(Date.parse(`${todayInVietnam()}T00:00:00Z`) + days * 86_400_000)
    .toISOString()
    .slice(0, 10);

describe("vaccinationCalendar", () => {
  it("lists upcoming appointments with generic titles and two reminders", async () => {
    const [family] = await handle.db.insert(schema.family).values({ name: "Test" }).returning();
    if (!family) throw new Error("no family");
    const child = await addChild(handle.db, {
      familyId: family.id,
      name: "Mây",
      sex: "female",
      birthDate: "2025-05-20",
    });
    await saveAppointment(handle.db, {
      childId: child.id,
      productCode: CATALOG.products[0]?.code ?? "",
      doseNo: 1,
      dueOn: inDays(10),
      note: null,
    });
    // Past and undated appointments stay out of the calendar.
    await saveAppointment(handle.db, {
      childId: child.id,
      productCode: CATALOG.products[1]?.code ?? "",
      doseNo: 1,
      dueOn: inDays(-10),
      note: null,
    });
    await saveAppointment(handle.db, {
      childId: child.id,
      productCode: CATALOG.products[2]?.code ?? "",
      doseNo: 1,
      dueOn: null,
      note: "sau 1 tuổi",
    });

    const ics = await vaccinationCalendar(handle.db, [child], translator("vi"));
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).toContain(`DTSTART;VALUE=DATE:${inDays(10).replaceAll("-", "")}`);
    expect(ics).toContain("SUMMARY:Lịch tiêm cho bé");
    expect(ics).not.toContain("Mây");
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2);
  });
});
