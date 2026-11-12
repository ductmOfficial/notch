import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  integer,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

const id = () => uuid().primaryKey().defaultRandom();
const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();

export const family = pgTable("family", {
  id: id(),
  name: text().notNull(),
  createdAt: createdAt(),
});

export const child = pgTable(
  "child",
  {
    id: id(),
    familyId: uuid()
      .notNull()
      .references(() => family.id, { onDelete: "cascade" }),
    name: text().notNull(),
    sex: text({ enum: ["male", "female"] }).notNull(),
    birthDate: date({ mode: "string" }).notNull(),
    birthTime: time(),
    createdAt: createdAt(),
  },
  (t) => [check("child_sex_check", sql`${t.sex} in ('male', 'female')`)],
);

/**
 * Measurements are stored as integers (grams, millimetres) to avoid float
 * rounding; the growth package works in kg and cm.
 */
export const measurement = pgTable(
  "measurement",
  {
    id: id(),
    childId: uuid()
      .notNull()
      .references(() => child.id, { onDelete: "cascade" }),
    measuredOn: date({ mode: "string" }).notNull(),
    weightG: integer(),
    lengthMm: integer(),
    headMm: integer(),
    /** How length/height was measured; null means the usual position for the age. */
    position: text({ enum: ["lying", "standing"] }),
    /** Each value was written as approximate ("~8,4"); flagged per value. */
    weightEstimated: boolean().notNull().default(false),
    lengthEstimated: boolean().notNull().default(false),
    headEstimated: boolean().notNull().default(false),
    note: text(),
    createdAt: createdAt(),
  },
  (t) => [
    check(
      "measurement_has_value",
      sql`${t.weightG} is not null or ${t.lengthMm} is not null or ${t.headMm} is not null`,
    ),
    check("measurement_weight_positive", sql`${t.weightG} > 0`),
    check("measurement_length_positive", sql`${t.lengthMm} > 0`),
    check("measurement_head_positive", sql`${t.headMm} > 0`),
    check("measurement_position_check", sql`${t.position} in ('lying', 'standing')`),
  ],
);

export const disease = pgTable("disease", {
  code: text().primaryKey(),
  nameVi: text().notNull(),
  nameEn: text().notNull(),
});

export const vaccineProduct = pgTable("vaccine_product", {
  code: text().primaryKey(),
  name: text().notNull(),
});

export const productDisease = pgTable(
  "product_disease",
  {
    productCode: text()
      .notNull()
      .references(() => vaccineProduct.code, { onDelete: "cascade" }),
    diseaseCode: text()
      .notNull()
      .references(() => disease.code),
  },
  (t) => [primaryKey({ columns: [t.productCode, t.diseaseCode] })],
);

export const vaccination = pgTable(
  "vaccination",
  {
    id: id(),
    childId: uuid()
      .notNull()
      .references(() => child.id, { onDelete: "cascade" }),
    productCode: text()
      .notNull()
      .references(() => vaccineProduct.code),
    doseNo: integer().notNull(),
    givenOn: date({ mode: "string" }).notNull(),
    place: text(),
    lot: text(),
    note: text(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("vaccination_child_dose").on(t.childId, t.productCode, t.doseNo),
    check("vaccination_dose_positive", sql`${t.doseNo} > 0`),
  ],
);

/** A dose booked by the clinic; `dueOn` is null for "after the first birthday". */
export const appointment = pgTable(
  "appointment",
  {
    id: id(),
    childId: uuid()
      .notNull()
      .references(() => child.id, { onDelete: "cascade" }),
    productCode: text()
      .notNull()
      .references(() => vaccineProduct.code),
    doseNo: integer().notNull(),
    dueOn: date({ mode: "string" }),
    note: text(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("appointment_child_dose").on(t.childId, t.productCode, t.doseNo),
    check("appointment_dose_positive", sql`${t.doseNo} > 0`),
  ],
);
