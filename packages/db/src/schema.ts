import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
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

// ── Sign-in (Better Auth) ────────────────────────────────────────────────
// Tables and columns follow Better Auth's core schema; it generates the text ids.

const updatedAt = () =>
  timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = pgTable(
  "session",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text().notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text().notNull(),
    providerId: text().notNull(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

/** One-time values such as magic-link tokens. */
export const verification = pgTable(
  "verification",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/** Sign-in attempts per client, so limits hold across serverless instances. */
export const rateLimit = pgTable("rate_limit", {
  id: text().primaryKey(),
  key: text().notNull().unique(),
  count: integer().notNull(),
  lastRequest: bigint({ mode: "number" }).notNull(),
});

/** Who belongs to which family. A user belongs to one family. */
export const familyMember = pgTable(
  "family_member",
  {
    familyId: uuid()
      .notNull()
      .references(() => family.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.familyId, t.userId] })],
);

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

/**
 * A family's calendar subscription link. Only a SHA-256 hash of the secret token is stored,
 * so the link is shown once, when created. One link per family; a new one replaces it.
 */
export const calendarToken = pgTable("calendar_token", {
  id: id(),
  familyId: uuid()
    .notNull()
    .unique()
    .references(() => family.id, { onDelete: "cascade" }),
  tokenHash: text().notNull().unique(),
  createdAt: createdAt(),
  lastUsedAt: timestamp({ withTimezone: true }),
});
