/**
 * Pythagorean numerology, as popular in Vietnam ("thần số học Pitago"), for the "just for
 * fun" page. It has no scientific basis; the page says so. Nothing here touches health data.
 */

/** Numbers kept whole instead of being reduced to one digit. */
const MASTER = new Set([11, 22, 33]);

export interface NumberReading {
  readonly value: number;
  /** How it was reached, such as "2+0+2+5+0+5+2+0 = 16 → 1+6 = 7" for 2025-05-20. */
  readonly working: string;
}

/** The decimal digits of a text, in order. */
const digitsOf = (text: string): number[] => (text.match(/\d/g) ?? []).map(Number);

/** Sums digits until one digit or a master number remains, recording each step. */
function reduce(digits: readonly number[]): NumberReading {
  let total = digits.reduce((a, b) => a + b, 0);
  const steps = [`${digits.join("+")} = ${String(total)}`];
  while (total > 9 && !MASTER.has(total)) {
    const next = digitsOf(String(total));
    total = next.reduce((a, b) => a + b, 0);
    steps.push(`${next.join("+")} = ${String(total)}`);
  }
  return { value: total, working: steps.join(" → ") };
}

/** Life path number: every digit of the birth date (YYYY-MM-DD), summed and reduced. */
export function lifePathNumber(birthDate: string): NumberReading {
  return reduce(digitsOf(birthDate));
}

/** Birthday number: the day of the month, reduced. */
export function birthdayNumber(birthDate: string): NumberReading {
  const day = Number(birthDate.slice(8, 10));
  return day <= 9 || MASTER.has(day)
    ? { value: day, working: String(day) }
    : reduce(digitsOf(String(day)));
}

/** A = 1 … I = 9, J = 1 … R = 9, S = 1 … Z = 8. */
const letterValue = (c: string) => ((c.charCodeAt(0) - 65) % 9) + 1;

/** The name's letters without Vietnamese marks: "Mây" → "MAY", "Đức" → "DUC". */
export function plainLetters(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "D")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

/** Expression ("sứ mệnh") number from the letters of a name; undefined without letters. */
export function expressionNumber(name: string): NumberReading | undefined {
  const letters = plainLetters(name);
  if (letters.length === 0) return undefined;
  return reduce((letters.match(/[A-Z]/g) ?? []).map(letterValue));
}

/** Vowels for the soul urge number; Y counts as one, as it sounds like "i" in Vietnamese names. */
const VOWELS = new Set(["A", "E", "I", "O", "U", "Y"]);

const lettersOf = (name: string) => plainLetters(name).match(/[A-Z]/g) ?? [];

/** Soul urge ("linh hồn") number: the vowels of a name; undefined without any. */
export function soulUrgeNumber(name: string): NumberReading | undefined {
  const vowels = lettersOf(name).filter((c) => VOWELS.has(c));
  return vowels.length === 0 ? undefined : reduce(vowels.map(letterValue));
}

/** Personality ("nhân cách") number: the consonants of a name; undefined without any. */
export function personalityNumber(name: string): NumberReading | undefined {
  const consonants = lettersOf(name).filter((c) => !VOWELS.has(c));
  return consonants.length === 0 ? undefined : reduce(consonants.map(letterValue));
}

/** Attitude ("thái độ") number: the digits of the day and month of birth. */
export function attitudeNumber(birthDate: string): NumberReading {
  return reduce(digitsOf(birthDate.slice(5)));
}

/** Reduces a whole number, such as a sum of two numbers, recording the steps. */
function reduceNumber(total: number, working: string): NumberReading {
  if (total <= 9 || MASTER.has(total))
    return { value: total, working: `${working} = ${String(total)}` };
  const next = reduce(digitsOf(String(total)));
  return { value: next.value, working: `${working} = ${String(total)} → ${next.working}` };
}

/** Maturity ("trưởng thành") number: the life path and expression numbers added. */
export function maturityNumber(lifePath: NumberReading, expression: NumberReading): NumberReading {
  return reduceNumber(
    lifePath.value + expression.value,
    `${String(lifePath.value)}+${String(expression.value)}`,
  );
}

/** Personal year ("năm cá nhân"): the day and month of birth with the digits of `year`. */
export function personalYearNumber(birthDate: string, year: number): NumberReading {
  return reduce([...digitsOf(birthDate.slice(5)), ...digitsOf(String(year))]);
}

// ── Birth chart ────────────────────────────────────────────────────────────

/** The eight lines of the 3×3 chart (3 6 9 / 2 5 8 / 1 4 7), by their Vietnamese names. */
export const ARROWS = {
  plan: [1, 2, 3],
  will: [4, 5, 6],
  action: [7, 8, 9],
  mind: [3, 6, 9],
  emotion: [2, 5, 8],
  practical: [1, 4, 7],
  determination: [1, 5, 9],
  intuition: [3, 5, 7],
} as const satisfies Record<string, readonly [number, number, number]>;

export type ArrowKey = keyof typeof ARROWS;

export interface BirthChart {
  /** How many times each digit 1–9 appears in the birth date; zeros do not count. */
  readonly counts: Readonly<Record<number, number>>;
  /** Lines whose three digits all appear. */
  readonly full: readonly ArrowKey[];
  /** Lines with none of their three digits. */
  readonly empty: readonly ArrowKey[];
  /** Digits 1–9 that do not appear at all. */
  readonly missing: readonly number[];
}

/** A 3×3 chart from any digits; zeros do not count. */
function chartOf(digits: readonly number[]): BirthChart {
  const counts: Record<number, number> = {};
  for (let d = 1; d <= 9; d++) counts[d] = 0;
  for (const d of digits) if (d > 0) counts[d] = (counts[d] ?? 0) + 1;
  const has = (d: number) => (counts[d] ?? 0) > 0;
  const keys = Object.keys(ARROWS) as ArrowKey[];
  return {
    counts,
    full: keys.filter((k) => ARROWS[k].every(has)),
    empty: keys.filter((k) => ARROWS[k].every((d) => !has(d))),
    missing: [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !has(d)),
  };
}

/** The Pythagorean birth chart of a date (YYYY-MM-DD). */
export function birthChart(birthDate: string): BirthChart {
  return chartOf(digitsOf(birthDate));
}

/**
 * The combined chart: the digits of the birth date with the letter values of the full name
 * (A=1 … I=9, marks dropped), so the name fills in what the date leaves empty.
 */
export function combinedChart(birthDate: string, name: string): BirthChart {
  return chartOf([...digitsOf(birthDate), ...lettersOf(name).map(letterValue)]);
}

// ── Pinnacles ──────────────────────────────────────────────────────────────

export interface Pinnacle {
  readonly reading: NumberReading;
  readonly fromAge: number;
  /** Last age of the period; null for the last one, which lasts for life. */
  readonly toAge: number | null;
}

/** A number reduced to one digit, master numbers included, for the pinnacle ages and sums. */
const single = (n: number): number => {
  let total = n;
  while (total > 9) total = digitsOf(String(total)).reduce((a, b) => a + b, 0);
  return total;
};

/**
 * The four pinnacles ("đỉnh cao"): month + day, day + year, the first two added, month + year,
 * each part reduced to one digit first. The first ends at 36 minus the life path number; each
 * of the next two lasts nine years; the last one lasts for life.
 */
export function pinnacles(birthDate: string): readonly Pinnacle[] {
  const month = single(Number(birthDate.slice(5, 7)));
  const day = single(Number(birthDate.slice(8, 10)));
  const year = single(Number(birthDate.slice(0, 4)));
  const firstEnd = 36 - single(lifePathNumber(birthDate).value);
  const p1 = reduceNumber(month + day, `${String(month)}+${String(day)}`);
  const p2 = reduceNumber(day + year, `${String(day)}+${String(year)}`);
  const p3 = reduceNumber(p1.value + p2.value, `${String(p1.value)}+${String(p2.value)}`);
  const p4 = reduceNumber(month + year, `${String(month)}+${String(year)}`);
  return [
    { reading: p1, fromAge: 0, toAge: firstEnd },
    { reading: p2, fromAge: firstEnd + 1, toAge: firstEnd + 9 },
    { reading: p3, fromAge: firstEnd + 10, toAge: firstEnd + 18 },
    { reading: p4, fromAge: firstEnd + 19, toAge: null },
  ];
}
