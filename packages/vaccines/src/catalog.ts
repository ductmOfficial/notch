/**
 * Diseases as the vaccination book lists them, and the vaccine products that
 * protect against them. One product can cover several diseases (Infanrix Hexa
 * covers six), so doses are recorded per product and shown per disease.
 */
export const DISEASE_CODES = [
  "tuberculosis",
  "hepatitis-b",
  "diphtheria",
  "tetanus",
  "pertussis",
  "hib",
  "polio",
  "rotavirus",
  "pneumococcal",
  "meningococcal-b",
  "meningococcal-acwy",
  "influenza",
  "hand-foot-mouth-ev71",
  "measles",
  "mumps",
  "rubella",
  "varicella",
  "japanese-encephalitis",
  "hepatitis-a",
  "typhoid",
  "hpv",
  "rabies",
] as const;

export type DiseaseCode = (typeof DISEASE_CODES)[number];

export interface Disease {
  readonly code: DiseaseCode;
  readonly name: { readonly vi: string; readonly en: string };
}

export interface VaccineProduct {
  /** Stable identifier, e.g. "infanrix-hexa". */
  readonly code: string;
  /** Brand name as printed on the vaccination record. */
  readonly name: string;
  readonly diseases: readonly DiseaseCode[];
}

export interface Catalog {
  readonly diseases: readonly Disease[];
  readonly products: readonly VaccineProduct[];
}

export const DISEASES: readonly Disease[] = [
  { code: "tuberculosis", name: { vi: "Lao", en: "Tuberculosis" } },
  { code: "hepatitis-b", name: { vi: "Viêm gan B", en: "Hepatitis B" } },
  { code: "diphtheria", name: { vi: "Bạch hầu", en: "Diphtheria" } },
  { code: "tetanus", name: { vi: "Uốn ván", en: "Tetanus" } },
  { code: "pertussis", name: { vi: "Ho gà", en: "Pertussis" } },
  { code: "hib", name: { vi: "Hib", en: "Haemophilus influenzae type b" } },
  { code: "polio", name: { vi: "Bại liệt", en: "Polio" } },
  { code: "rotavirus", name: { vi: "Tiêu chảy do rotavirus", en: "Rotavirus" } },
  { code: "pneumococcal", name: { vi: "Phế cầu", en: "Pneumococcal disease" } },
  { code: "meningococcal-b", name: { vi: "Não mô cầu nhóm B", en: "Meningococcal B" } },
  {
    code: "meningococcal-acwy",
    name: { vi: "Não mô cầu nhóm A, C, W, Y", en: "Meningococcal ACWY" },
  },
  { code: "influenza", name: { vi: "Cúm", en: "Influenza" } },
  {
    code: "hand-foot-mouth-ev71",
    name: { vi: "Tay chân miệng (EV71)", en: "Hand, foot and mouth disease (EV71)" },
  },
  { code: "measles", name: { vi: "Sởi", en: "Measles" } },
  { code: "mumps", name: { vi: "Quai bị", en: "Mumps" } },
  { code: "rubella", name: { vi: "Rubella", en: "Rubella" } },
  { code: "varicella", name: { vi: "Thủy đậu", en: "Varicella" } },
  { code: "japanese-encephalitis", name: { vi: "Viêm não Nhật Bản", en: "Japanese encephalitis" } },
  { code: "hepatitis-a", name: { vi: "Viêm gan A", en: "Hepatitis A" } },
  { code: "typhoid", name: { vi: "Thương hàn", en: "Typhoid" } },
  { code: "hpv", name: { vi: "HPV", en: "Human papillomavirus" } },
  { code: "rabies", name: { vi: "Dại", en: "Rabies" } },
];

/** Products recorded so far. Add a product when a child first receives it. */
export const PRODUCTS: readonly VaccineProduct[] = [
  { code: "bcg", name: "BCG", diseases: ["tuberculosis"] },
  { code: "gene-hbvax", name: "Gene-HBvax", diseases: ["hepatitis-b"] },
  {
    code: "infanrix-hexa",
    name: "Infanrix Hexa",
    diseases: ["diphtheria", "tetanus", "pertussis", "hib", "polio", "hepatitis-b"],
  },
  { code: "rotarix", name: "Rotarix", diseases: ["rotavirus"] },
  { code: "prevenar-20", name: "Prevenar 20", diseases: ["pneumococcal"] },
  { code: "bexsero", name: "Bexsero", diseases: ["meningococcal-b"] },
  { code: "envacgen", name: "Envacgen", diseases: ["hand-foot-mouth-ev71"] },
  { code: "vaxigrip", name: "Vaxigrip", diseases: ["influenza"] },
  { code: "menquadfi", name: "MenQuadfi", diseases: ["meningococcal-acwy"] },
];

export const CATALOG: Catalog = { diseases: DISEASES, products: PRODUCTS };

/** Throws on duplicate codes or products that reference unknown diseases. */
export function validateCatalog(catalog: Catalog): void {
  const diseases = new Set<string>();
  for (const disease of catalog.diseases) {
    if (diseases.has(disease.code)) throw new Error(`Duplicate disease "${disease.code}"`);
    diseases.add(disease.code);
  }
  const products = new Set<string>();
  for (const product of catalog.products) {
    if (products.has(product.code)) throw new Error(`Duplicate product "${product.code}"`);
    products.add(product.code);
    if (product.diseases.length === 0) throw new Error(`${product.code}: no diseases`);
    for (const code of product.diseases) {
      if (!diseases.has(code)) throw new Error(`${product.code}: unknown disease "${code}"`);
    }
  }
}
