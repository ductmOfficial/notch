import { describe, expect, it } from "vitest";

import {
  fieldValue,
  parseAppointmentForm,
  parseChildForm,
  parseDecimal,
  parseDoseForm,
  parseMeasurementForm,
} from "./form-values";

const CTX = {
  childId: "00000000-0000-4000-8000-000000000001",
  birthDate: "2030-01-01",
  today: "2030-06-01",
};
const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [k, v] of Object.entries(entries)) data.set(k, v);
  return data;
};

describe("parseDecimal", () => {
  it.each([
    ["8,6", 8.6],
    ["8.6", 8.6],
    [" 69 ", 69],
    ["", null],
  ])("%j → %j", (raw, expected) => {
    expect(parseDecimal(raw)).toBe(expected);
  });

  it.each(["8,6,1", "abc", "-2", "1e3"])("%j is not a number", (raw) => {
    expect(parseDecimal(raw)).toBeNaN();
  });
});

describe("parseMeasurementForm", () => {
  it("converts to grams and millimetres and keeps estimate flags only for given values", () => {
    const parsed = parseMeasurementForm(
      form({
        measuredOn: "2030-05-01",
        weightKg: "8,6",
        lengthCm: "69",
        headCm: "",
        weightEstimated: "on",
        headEstimated: "on",
        note: " ok ",
      }),
      CTX,
    );
    expect(parsed).toEqual({
      ok: true,
      input: {
        childId: CTX.childId,
        measuredOn: "2030-05-01",
        weightG: 8600,
        lengthMm: 690,
        headMm: null,
        weightEstimated: true,
        lengthEstimated: false,
        headEstimated: false,
        note: "ok",
      },
    });
  });

  it("reports field errors in Vietnamese and keeps what was typed", () => {
    const parsed = parseMeasurementForm(
      form({ measuredOn: "2030-07-01", weightKg: "abc", lengthCm: "300" }),
      CTX,
    );
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.state.errors).toEqual({
      measuredOn: "Ngày đo không thể ở tương lai.",
      weightKg: "Cân nặng phải là số, ví dụ 8,6.",
      lengthCm: "Chiều dài phải từ 30 đến 150 cm.",
    });
    expect(fieldValue(parsed.state, "weightKg")).toBe("abc");
  });

  it("requires a date and at least one value", () => {
    const parsed = parseMeasurementForm(form({ measuredOn: "" }), CTX);
    expect(parsed.ok ? {} : parsed.state.errors).toEqual({
      measuredOn: "Nhập ngày đo.",
      weightKg: "Nhập ít nhất một chỉ số.",
    });
  });

  it("rejects dates before birth and malformed dates", () => {
    const before = parseMeasurementForm(form({ measuredOn: "2029-12-31", weightKg: "3" }), CTX);
    const bad = parseMeasurementForm(form({ measuredOn: "2030-13-45", weightKg: "3" }), CTX);
    expect(before.ok ? "" : before.state.errors?.measuredOn).toBe(
      "Ngày đo không thể trước ngày sinh.",
    );
    expect(bad.ok ? "" : bad.state.errors?.measuredOn).toBe("Ngày đo không hợp lệ.");
  });
});

describe("parseDoseForm", () => {
  const dose = { productCode: "infanrix-hexa", doseNo: "1", givenOn: "2030-03-01" };

  it("builds a dose without an appointment when the next fields are empty", () => {
    const parsed = parseDoseForm(form({ ...dose, nextDoseNo: "2", place: "VNVC" }), CTX);
    expect(parsed).toMatchObject({
      ok: true,
      input: { doseNo: 1, place: "VNVC", lot: null, nextAppointment: null },
    });
  });

  it("adds the next appointment, dated or undated", () => {
    const dated = parseDoseForm(form({ ...dose, nextDoseNo: "2", nextDueOn: "2030-04-01" }), CTX);
    const undated = parseDoseForm(form({ ...dose, nextDoseNo: "2", nextNote: "sau 1 tuổi" }), CTX);
    expect(dated).toMatchObject({
      ok: true,
      input: { nextAppointment: { doseNo: 2, dueOn: "2030-04-01", note: null } },
    });
    expect(undated).toMatchObject({
      ok: true,
      input: { nextAppointment: { doseNo: 2, dueOn: null, note: "sau 1 tuổi" } },
    });
  });

  it("validates product, dose numbers and dates", () => {
    const parsed = parseDoseForm(
      form({
        productCode: "nope",
        doseNo: "0",
        givenOn: "2030-03-01",
        nextDoseNo: "x",
        nextDueOn: "2030-02-01",
      }),
      CTX,
    );
    expect(parsed.ok ? {} : parsed.state.errors).toEqual({
      productCode: "Chọn vaccine trong danh sách.",
      doseNo: "Mũi số phải là số nguyên từ 1 đến 20.",
      nextDoseNo: "Mũi hẹn phải là số nguyên từ 1 đến 20.",
      nextDueOn: "Ngày hẹn phải sau ngày tiêm.",
    });
  });
});

describe("parseAppointmentForm", () => {
  it("accepts a date or a note", () => {
    expect(
      parseAppointmentForm(form({ productCode: "bexsero", doseNo: "2", dueOn: "2030-07-01" }), CTX),
    ).toMatchObject({
      ok: true,
      input: { doseNo: 2, dueOn: "2030-07-01", note: null },
    });
    expect(
      parseAppointmentForm(form({ productCode: "bexsero", doseNo: "3", note: "sau 1 tuổi" }), CTX),
    ).toMatchObject({
      ok: true,
      input: { dueOn: null, note: "sau 1 tuổi" },
    });
  });

  it("requires a date or a note", () => {
    const parsed = parseAppointmentForm(form({ productCode: "bexsero", doseNo: "3" }), CTX);
    expect(parsed.ok ? "" : parsed.state.errors?.dueOn).toContain("Nhập ngày hẹn");
  });

  it("falls back to defaults when there is no typed value", () => {
    expect(fieldValue({}, "doseNo", "2")).toBe("2");
  });
});

describe("parseChildForm", () => {
  const ctx = { familyId: "00000000-0000-4000-8000-000000000009", today: "2030-06-01" };

  it("builds the profile for the signed-in family", () => {
    const parsed = parseChildForm(
      form({ name: " Bông ", sex: "female", birthDate: "2030-05-01", familyId: "ignored" }),
      ctx,
    );
    expect(parsed).toEqual({
      ok: true,
      input: { familyId: ctx.familyId, name: "Bông", sex: "female", birthDate: "2030-05-01" },
    });
  });

  it("names every missing field", () => {
    const parsed = parseChildForm(form({ name: "", sex: "", birthDate: "" }), ctx);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.state.errors).toEqual({
      name: "Nhập tên bé.",
      sex: "Chọn bé gái hoặc bé trai.",
      birthDate: "Nhập ngày sinh.",
    });
  });

  it("refuses a birth date in the future and a name over 60 characters", () => {
    const parsed = parseChildForm(
      form({ name: "x".repeat(61), sex: "male", birthDate: "2030-06-02" }),
      { ...ctx, locale: "en" },
    );
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.state.errors).toEqual({
      name: "The name can be at most 60 characters.",
      birthDate: "The date of birth cannot be in the future.",
    });
    expect(parsed.state.values?.sex).toBe("male");
  });
});
