import { listAppointments, listMeasurements, listVaccinations } from "@notch/db";

import { getCurrentChild } from "../../lib/child";
import { getDb } from "../../lib/db";
import { todayInVietnam } from "../../lib/format";
import { getI18n } from "../../lib/i18n/server";
import { renderReport } from "../../lib/report-pdf";

export const dynamic = "force-dynamic";

/**
 * The selected child's record as a PDF, for a doctor's visit or to print. The file name
 * is generic, so it reveals nothing in a downloads folder or a chat preview.
 */
export async function GET(request: Request): Promise<Response> {
  const db = getDb();
  if (!db) return new Response("DATABASE_URL is not configured", { status: 503 });
  const { child } = await getCurrentChild(
    db,
    new URL(request.url).searchParams.get("child") ?? undefined,
  );
  if (!child) return new Response("No child", { status: 404 });

  const [{ locale }, measurements, vaccinations, appointments] = await Promise.all([
    getI18n(),
    listMeasurements(db, child.id),
    listVaccinations(db, child.id),
    listAppointments(db, child.id),
  ]);
  const pdf = await renderReport({ child, measurements, vaccinations, appointments, locale });
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="notch-report-${todayInVietnam()}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
