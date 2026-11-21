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
