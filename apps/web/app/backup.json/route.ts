import { exportBackup } from "@notch/db";

import { getDb } from "../../lib/db";
import { todayInVietnam } from "../../lib/format";
import { requireViewer } from "../../lib/session";

export const dynamic = "force-dynamic";

/** The signed-in family's records as a JSON file (see packages/db/src/backup.ts). */
export async function GET(): Promise<Response> {
  const { familyId } = await requireViewer();
  const db = getDb();
  if (!db) return new Response("DATABASE_URL is not configured", { status: 503 });
  const backup = await exportBackup(db, familyId);
  return new Response(`${JSON.stringify(backup, null, 2)}\n`, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="notch-backup-${todayInVietnam()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
