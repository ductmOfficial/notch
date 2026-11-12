const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

function parts(date: string): [number, number, number] {
  const match = ISO.exec(date);
  if (!match) throw new RangeError(`Expected YYYY-MM-DD, got "${date}"`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Adds whole months to a date, clamping to the last day of the target month. */
function addMonths([y, m, d]: [number, number, number], months: number): number {
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(d, lastDay));
}

/**
 * Calendar age, e.g. "7 tháng 24 ngày", "1 tuổi 2 tháng", "5 ngày": the
 * number of whole months whose anniversary has passed, then the days since.
 */
export function formatAge(birthDate: string, onDate: string): string {
  const birth = parts(birthDate);
  const [y, m, d] = parts(onDate);
  const on = Date.UTC(y, m - 1, d);
  if (on < Date.UTC(birth[0], birth[1] - 1, birth[2])) return "chưa sinh";

  let months = (y - birth[0]) * 12 + (m - birth[1]);
  while (months > 0 && addMonths(birth, months) > on) months -= 1;
  const days = Math.round((on - addMonths(birth, months)) / 86_400_000);

  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years > 0)
    return rest > 0 ? `${String(years)} tuổi ${String(rest)} tháng` : `${String(years)} tuổi`;
  if (months === 0) return `${String(days)} ngày`;
  return days > 0 ? `${String(months)} tháng ${String(days)} ngày` : `${String(months)} tháng`;
}

/** 2026-11-09 → 09/11/2026 */
export function formatDate(date: string): string {
  const [y, m, d] = parts(date);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${String(y)}`;
}

const formatters = new Map<number, Intl.NumberFormat>();

/** Vietnamese number format (decimal comma), with a fixed number of decimals. */
export function formatNumber(value: number, digits: number): string {
  let formatter = formatters.get(digits);
  if (!formatter) {
    formatter = new Intl.NumberFormat("vi-VN", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    formatters.set(digits, formatter);
  }
  return formatter.format(value);
}

export function formatZ(z: number): string {
  return `${z >= 0 ? "+" : "−"}${formatNumber(Math.abs(z), 2)}`;
}

/** Plain-language band for a z-score; descriptive only, not a diagnosis. */
export function zBand(z: number): string {
  if (z < -3) return "dưới −3 SD";
  if (z < -2) return "từ −3 đến −2 SD";
  if (z <= 2) return "trong khoảng ±2 SD";
  if (z <= 3) return "từ +2 đến +3 SD";
  return "trên +3 SD";
}

/** Today's date (YYYY-MM-DD) in Vietnam, independent of the server's time zone. */
export function todayInVietnam(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(now);
}
