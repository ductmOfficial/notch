import type { DiseaseCode } from "./catalog.js";

interface Text {
  readonly vi: string;
  readonly en: string;
}

/** One dose of the national expanded programme (TCMR) for children. */
export interface TcmrDose {
  readonly disease: DiseaseCode;
  /** 1-based, in schedule order for that disease. */
  readonly doseNo: number;
  /** The vaccine as the circular names it. */
  readonly vaccine: Text;
  /** Recommended age in whole months (0 at birth). */
  readonly ageMonths: number;
  /** The timing as the circular states it, when more precise than the month. */
  readonly timing?: Text;
}

export interface TcmrSource {
  readonly document: string;
  readonly issuer: string;
  readonly issuedOn: string;
  readonly effectiveOn: string;
  readonly replaces: string;
}

/**
 * Source of the schedule: Article 1 of the circular, child doses only (the tetanus doses for
 * pregnant women are left out). Catch-up rules for late doses are not modelled; the app shows
 * the on-time schedule. In the circular, "1 month" between doses means at least 28 days.
 */
export const TCMR_SOURCE: TcmrSource = {
  document: "Thông tư 52/2025/TT-BYT",
  issuer: "Bộ Y tế",
  issuedOn: "2025-12-31",
  effectiveOn: "2026-02-15",
  replaces: "Thông tư 10/2024/TT-BYT",
};

const COMBO = (component: Text): Text => ({
  vi: `Vắc xin phối hợp có chứa thành phần ${component.vi}`,
  en: `Combination vaccine containing ${component.en}`,
});
const MONTH_AFTER = (n: number): Text => ({
  vi: `ít nhất 1 tháng sau lần ${String(n)}`,
  en: `at least 1 month after dose ${String(n)}`,
});

const HEPB = COMBO({ vi: "viêm gan B", en: "hepatitis B" });
const DIPHTHERIA = COMBO({ vi: "bạch hầu", en: "diphtheria" });
const PERTUSSIS = COMBO({ vi: "ho gà", en: "pertussis" });
const TETANUS = COMBO({ vi: "uốn ván", en: "tetanus" });
const HIB: Text = {
  vi: "Vắc xin Haemophilus influenzae týp b đơn giá hoặc vắc xin phối hợp có chứa thành phần Hib",
  en: "Haemophilus influenzae type b vaccine, alone or in a combination vaccine",
};

/** Three doses from 2 months, at least a month apart (hepatitis B, DTP, Hib, oral polio). */
const primary = (disease: DiseaseCode, vaccine: Text, first = 1): TcmrDose[] => [
  { disease, doseNo: first, vaccine, ageMonths: 2 },
  { disease, doseNo: first + 1, vaccine, ageMonths: 3, timing: MONTH_AFTER(first) },
  { disease, doseNo: first + 2, vaccine, ageMonths: 4, timing: MONTH_AFTER(first + 1) },
];

const booster18 = (disease: DiseaseCode, doseNo: number, vaccine: Text): TcmrDose => ({
  disease,
  doseNo,
  vaccine,
  ageMonths: 18,
  timing: { vi: "nhắc lại lần 1", en: "first booster" },
});

const booster7y = (disease: DiseaseCode, doseNo: number, vaccine: Text): TcmrDose => ({
  disease,
  doseNo,
  vaccine,
  ageMonths: 84,
  timing: { vi: "nhắc lại lần 2", en: "second booster" },
});

const REDUCED_DIPHTHERIA: Text = {
  vi: "Vắc xin phối hợp có chứa thành phần bạch hầu giảm liều",
  en: "Combination vaccine with a reduced diphtheria dose",
};

/** The child doses of Article 1, in the circular's order of diseases. */
export const TCMR_DOSES: readonly TcmrDose[] = [
  {
    disease: "hepatitis-b",
    doseNo: 1,
    vaccine: { vi: "Vắc xin viêm gan B đơn giá", en: "Monovalent hepatitis B vaccine" },
    ageMonths: 0,
    timing: { vi: "trong 24 giờ sau khi sinh", en: "within 24 hours of birth" },
  },
  ...primary("hepatitis-b", HEPB, 2),
  {
    disease: "tuberculosis",
    doseNo: 1,
    vaccine: { vi: "Vắc xin lao (BCG)", en: "Tuberculosis vaccine (BCG)" },
    ageMonths: 0,
    timing: { vi: "trong 1 tháng sau khi sinh", en: "within a month of birth" },
  },
  ...primary("diphtheria", DIPHTHERIA),
  booster18("diphtheria", 4, DIPHTHERIA),
  booster7y("diphtheria", 5, REDUCED_DIPHTHERIA),
  ...primary("pertussis", PERTUSSIS),
  booster18("pertussis", 4, PERTUSSIS),
  ...primary("tetanus", TETANUS),
  booster18("tetanus", 4, TETANUS),
  booster7y("tetanus", 5, TETANUS),
  ...primary("polio", { vi: "Vắc xin bại liệt uống", en: "Oral polio vaccine" }),
  {
    disease: "polio",
    doseNo: 4,
    vaccine: { vi: "Vắc xin bại liệt tiêm", en: "Inactivated polio vaccine" },
    ageMonths: 5,
  },
  {
    disease: "polio",
    doseNo: 5,
    vaccine: { vi: "Vắc xin bại liệt tiêm", en: "Inactivated polio vaccine" },
    ageMonths: 9,
  },
  ...primary("hib", HIB),
  {
    disease: "measles",
    doseNo: 1,
    vaccine: { vi: "Vắc xin sởi đơn giá", en: "Monovalent measles vaccine" },
    ageMonths: 9,
  },
  booster18("measles", 2, COMBO({ vi: "sởi", en: "measles" })),
  {
    disease: "rubella",
    doseNo: 1,
    vaccine: COMBO({ vi: "rubella", en: "rubella" }),
    ageMonths: 18,
  },
  {
    disease: "japanese-encephalitis",
    doseNo: 1,
    vaccine: { vi: "Vắc xin viêm não Nhật Bản", en: "Japanese encephalitis vaccine" },
    ageMonths: 12,
  },
  {
    disease: "japanese-encephalitis",
    doseNo: 2,
    vaccine: { vi: "Vắc xin viêm não Nhật Bản", en: "Japanese encephalitis vaccine" },
    ageMonths: 12,
    timing: { vi: "1–2 tuần sau lần 1", en: "1–2 weeks after dose 1" },
  },
  {
    disease: "japanese-encephalitis",
    doseNo: 3,
    vaccine: { vi: "Vắc xin viêm não Nhật Bản", en: "Japanese encephalitis vaccine" },
    ageMonths: 24,
    timing: { vi: "1 năm sau lần 1", en: "1 year after dose 1" },
  },
  {
    disease: "rotavirus",
    doseNo: 1,
    vaccine: { vi: "Vắc xin Rota (uống)", en: "Rotavirus vaccine (oral)" },
    ageMonths: 2,
  },
  {
    disease: "rotavirus",
    doseNo: 2,
    vaccine: { vi: "Vắc xin Rota (uống)", en: "Rotavirus vaccine (oral)" },
    ageMonths: 3,
    timing: {
      vi: "ít nhất 1 tháng sau lần 1, trước khi đủ 6 tháng tuổi",
      en: "at least 1 month after dose 1, before 6 months of age",
    },
  },
  {
    disease: "pneumococcal",
    doseNo: 1,
    vaccine: { vi: "Vắc xin phế cầu", en: "Pneumococcal vaccine" },
    ageMonths: 2,
  },
  {
    disease: "pneumococcal",
    doseNo: 2,
    vaccine: { vi: "Vắc xin phế cầu", en: "Pneumococcal vaccine" },
    ageMonths: 4,
    timing: { vi: "ít nhất 2 tháng sau lần 1", en: "at least 2 months after dose 1" },
  },
];

export interface TcmrRow extends TcmrDose {
  /** Doses recorded for the disease, from any product, reach this dose number. */
  readonly recorded: boolean;
}

export interface TcmrGroup {
  readonly ageMonths: number;
  /** The child has reached this age. */
  readonly reached: boolean;
  readonly rows: readonly TcmrRow[];
}

/**
 * The TCMR schedule grouped by age, next to what is recorded for the child. A dose counts as
 * recorded when the child has at least that many doses for the disease, whatever the product:
 * a reference, not a medical assessment (a service vaccine can follow another schedule).
 */
export function tcmrOverview(
  dosesPerDisease: ReadonlyMap<DiseaseCode, number>,
  childAgeMonths: number,
): TcmrGroup[] {
  const groups = new Map<number, TcmrRow[]>();
  for (const dose of TCMR_DOSES) {
    const rows = groups.get(dose.ageMonths) ?? [];
    rows.push({ ...dose, recorded: (dosesPerDisease.get(dose.disease) ?? 0) >= dose.doseNo });
    groups.set(dose.ageMonths, rows);
  }
  return [...groups.entries()]
    .toSorted(([a], [b]) => a - b)
    .map(([ageMonths, rows]) => ({ ageMonths, reached: childAgeMonths >= ageMonths, rows }));
}
