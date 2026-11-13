import { getCurrentChild } from "../../lib/child";
import { vaccinationCalendar } from "../../lib/calendar-feed";
import { getDb } from "../../lib/db";
import { getI18n } from "../../lib/i18n/server";

export const dynamic = "force-dynamic";

/** One-off download of the selected child's upcoming appointments (signed in). */
export async function GET(request: Request): Promise<Response> {
  const db = getDb();
  if (!db) return new Response("DATABASE_URL is not configured", { status: 503 });
  const { child } = await getCurrentChild(
    db,
    new URL(request.url).searchParams.get("child") ?? undefined,
  );
  if (!child) return new Response("No child", { status: 404 });

  const { t } = await getI18n();
  return new Response(await vaccinationCalendar(db, [child], t), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="notch-lich-tiem.ics"',
      "Cache-Control": "no-store",
    },
  });
}
