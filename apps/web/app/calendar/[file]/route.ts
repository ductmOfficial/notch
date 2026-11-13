import { familyIdForCalendarToken, listChildren } from "@notch/db";

import { vaccinationCalendar } from "../../../lib/calendar-feed";
import { getDb } from "../../../lib/db";
import { getI18n } from "../../../lib/i18n/server";

export const dynamic = "force-dynamic";

const NOT_FOUND = () => new Response("Not found", { status: 404 });

/**
 * The calendar subscription: /calendar/<token>.ics, read by calendar apps without a
 * session. The secret token stands for the family; an unknown or revoked one gets the
 * same 404 as a malformed one. Every child of the family is in the feed.
 */
export async function GET(
  _: Request,
  { params }: { params: Promise<{ file: string }> },
): Promise<Response> {
  const db = getDb();
  if (!db) return new Response("DATABASE_URL is not configured", { status: 503 });
  const { file } = await params;
  if (!file.endsWith(".ics")) return NOT_FOUND();
  const familyId = await familyIdForCalendarToken(db, file.slice(0, -".ics".length));
  if (!familyId) return NOT_FOUND();

  const { t } = await getI18n();
  const body = await vaccinationCalendar(db, await listChildren(db, familyId), t);
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      // Calendar apps poll; an hour keeps the feed fresh without hammering the database.
      "Cache-Control": "private, max-age=3600",
      "X-Robots-Tag": "noindex",
      "Referrer-Policy": "no-referrer",
    },
  });
}
