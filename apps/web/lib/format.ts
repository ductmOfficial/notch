import { type Locale, translator } from "./i18n/messages";

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

const plural = (n: number, one: string, many: string) => `${String(n)} ${n === 1 ? one : many}`;

/**
 * Calendar age, e.g. "7 tháng 24 ngày" / "7 months 24 days", "1 tuổi 2 tháng" / "1 year
 * 2 months": the number of whole months whose anniversary has passed, then the days since.
 */
export function formatAge(birthDate: string, onDate: string, locale: Locale = "vi"): string {
  const birth = parts(birthDate);
  const [y, m, d] = parts(onDate);
  const on = Date.UTC(y, m - 1, d);
  if (on < Date.UTC(birth[0], birth[1] - 1, birth[2])) return translator(locale)("age.unborn");

  let months = (y - birth[0]) * 12 + (m - birth[1]);
  while (months > 0 && addMonths(birth, months) > on) months -= 1;
  const days = Math.round((on - addMonths(birth, months)) / 86_400_000);

  const years = Math.floor(months / 12);
  const rest = months % 12;
  const unit =
    locale === "vi"
      ? {
          y: (n: number) => `${String(n)} tuổi`,
          m: (n: number) => `${String(n)} tháng`,
          d: (n: number) => `${String(n)} ngày`,
        }
      : {
          y: (n: number) => plural(n, "year", "years"),
          m: (n: number) => plural(n, "month", "months"),
          d: (n: number) => plural(n, "day", "days"),
        };
  if (years > 0) return rest > 0 ? `${unit.y(years)} ${unit.m(rest)}` : unit.y(years);
  if (months === 0) return unit.d(days);
  return days > 0 ? `${unit.m(months)} ${unit.d(days)}` : unit.m(months);
}

const MONTHS_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** 2026-11-09 → 09/11/2026 (vi) or 9 Nov 2026 (en). */
export function formatDate(date: string, locale: Locale = "vi"): string {
  const [y, m, d] = parts(date);
  if (locale === "en") return `${String(d)} ${MONTHS_EN[m - 1] ?? ""} ${String(y)}`;
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${String(y)}`;
}

const formatters = new Map<string, Intl.NumberFormat>();

/** Number with a fixed number of decimals: decimal comma in Vietnamese, point in English. */
export function formatNumber(value: number, digits: number, locale: Locale = "vi"): string {
  const key = `${locale}:${String(digits)}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    formatters.set(key, formatter);
  }
  return formatter.format(value);
}

export function formatZ(z: number, locale: Locale = "vi"): string {
  return `${z >= 0 ? "+" : "−"}${formatNumber(Math.abs(z), 2, locale)}`;
}

/** Plain-language band for a z-score; descriptive only, not a diagnosis. */
export function zBand(z: number, locale: Locale = "vi"): string {
  const t = translator(locale);
  if (z < -3) return t("z.below3");
  if (z < -2) return t("z.from3to2");
  if (z <= 2) return t("z.within2");
  if (z <= 3) return t("z.from2to3");
  return t("z.above3");
}

/** Today's date (YYYY-MM-DD) in Vietnam, independent of the server's time zone. */
export function todayInVietnam(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(now);
}
