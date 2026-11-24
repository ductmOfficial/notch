/** What a backup file holds, read in the browser for the confirmation; the server validates it fully. */
export interface BackupSummary {
  /** ISO timestamp of the export, or "" when the file has none. */
  readonly exportedAt: string;
  readonly version: number;
  readonly children: number;
  readonly measurements: number;
  readonly vaccinations: number;
  readonly appointments: number;
  readonly healthEntries: number;
  readonly temperatures: number;
  readonly milestones: number;
}

/** What each backup version added; a file of an older version restores without it. */
export type BackupPart = "health" | "names" | "milestones";

const ADDED_IN: Record<BackupPart, number> = { health: 2, names: 3, milestones: 4 };

type Lists = "measurements" | "vaccinations" | "appointments" | "healthEntries" | "temperatures";
type ChildLists = Partial<Record<Lists | "milestones", unknown>>;

/** Throws when the JSON is not a Notch backup at all. */
export function summarizeBackup(json: unknown): BackupSummary {
  const data = json as { format?: unknown; version?: unknown; exportedAt?: unknown };
  const children = (json as { children?: unknown }).children;
  if (data.format !== "notch-backup" || !Array.isArray(children)) throw new Error("format");
  const list = children as ChildLists[];
  const count = (key: keyof ChildLists) =>
    list.reduce((sum, c) => {
      const items = c[key];
      return sum + (Array.isArray(items) ? items.length : 0);
    }, 0);
  return {
    exportedAt: typeof data.exportedAt === "string" ? data.exportedAt : "",
    version: typeof data.version === "number" ? data.version : 1,
    children: list.length,
    measurements: count("measurements"),
    vaccinations: count("vaccinations"),
    appointments: count("appointments"),
    healthEntries: count("healthEntries"),
    temperatures: count("temperatures"),
    milestones: count("milestones"),
  };
}

/**
 * The parts an older backup does not hold. A restore replaces everything, so the family's
 * current records of these kinds are lost: the confirmation says so.
 */
export function missingParts(version: number): BackupPart[] {
  return (Object.keys(ADDED_IN) as BackupPart[]).filter((part) => version < ADDED_IN[part]);
}
