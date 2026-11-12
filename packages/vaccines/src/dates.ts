const MS_PER_DAY = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Days since 1970-01-01 for a YYYY-MM-DD calendar date. */
export function toDayNumber(date: string): number {
  const match = ISO_DATE.exec(date);
  if (!match) throw new RangeError(`Expected a YYYY-MM-DD date, got "${date}"`);
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const time = Date.UTC(y, m - 1, d);
  const check = new Date(time);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) {
    throw new RangeError(`Invalid date "${date}"`);
  }
  return time / MS_PER_DAY;
}

export function fromDayNumber(day: number): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}
