const MS_PER_DAY = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** WHO switches from recumbent length to standing height at 731 days. */
export const HEIGHT_FROM_DAYS = 731;

function parseIsoDate(date: string): number {
  const match = ISO_DATE.exec(date);
  if (!match) throw new RangeError(`Expected a YYYY-MM-DD date, got "${date}"`);
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const time = Date.UTC(y, m - 1, d);
  const check = new Date(time);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) {
    throw new RangeError(`Invalid date "${date}"`);
  }
  return time;
}

/** Whole days between two calendar dates (YYYY-MM-DD), independent of time zone. */
export function ageInDays(birthDate: string, onDate: string): number {
  return Math.round((parseIsoDate(onDate) - parseIsoDate(birthDate)) / MS_PER_DAY);
}

/**
 * WHO adjustment when the measuring position does not match the age: add
 * 0.7 cm for a child under 731 days measured standing, subtract 0.7 cm for an
 * older child measured lying down.
 */
export function adjustLengthHeight(
  cm: number,
  ageDays: number,
  position: "lying" | "standing",
): number {
  if (ageDays < HEIGHT_FROM_DAYS && position === "standing") return cm + 0.7;
  if (ageDays >= HEIGHT_FROM_DAYS && position === "lying") return cm - 0.7;
  return cm;
}

/** Body-mass index in kg/m² from weight in kg and length/height in cm. */
export function bmi(weightKg: number, heightCm: number): number {
  const metres = heightCm / 100;
  return weightKg / (metres * metres);
}
