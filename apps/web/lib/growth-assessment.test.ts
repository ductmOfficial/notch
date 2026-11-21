import { describe, expect, it } from "vitest";

import { chartSubtitle, readGrowth } from "./growth-assessment";
import type { ChartPoint } from "./growth-chart";

// Fixture only; not anyone's real record. A girl of about 18 months.
const BIRTH = "2028-12-29"; // 549 days before 2030-07-01
const point = (z: number | undefined, over: Partial<ChartPoint> = {}): ChartPoint => ({
  date: "2030-07-01",
  ageDays: 549,
  value: 10,
  z,
  percentile: undefined,
  estimated: false,
  ...over,
});
const earlier = (z: number, over: Partial<ChartPoint> = {}) =>
  point(z, { date: "2030-04-01", ageDays: 457, ...over });

describe("readGrowth", () => {
  it("reads a normal weight with the normal range at the child's age", () => {
    const reading = readGrowth("weight", "female", BIRTH, [earlier(-0.2), point(-0.1)]);
    expect(reading).toEqual({
      status: "normal",
      statusLevel: "normal",
      level: "normal",
      label: "Bình thường",
      range: "Bình thường ở 1 tuổi 6 tháng: 8,1–11,6 kg",
      change: undefined,
      advice: "Phát triển bình thường. Tiếp tục đo định kỳ.",
    });
  });

  it("asks for a doctor when WHO names a problem", () => {
    const reading = readGrowth("length", "female", BIRTH, [point(-2.4)]);
    expect(reading).toMatchObject({ label: "Thấp còi", statusLevel: "doctor", level: "doctor" });
    expect(reading?.advice).toContain("bác sĩ nhi");
  });

  it("gives its own advice for statuses that only ask for a closer look", () => {
    expect(readGrowth("weight", "female", BIRTH, [point(1.4)])?.advice).toContain("BMI");
    expect(readGrowth("bmi", "female", BIRTH, [point(1.4)])).toMatchObject({
      label: "Có nguy cơ thừa cân",
      level: "watch",
    });
    expect(readGrowth("length", "female", BIRTH, [point(3.2)])?.label).toBe("Rất cao so với tuổi");
  });

  it("sends a fall of a whole SD to the doctor, even within the normal range", () => {
    const reading = readGrowth("weight", "female", BIRTH, [earlier(0.8), point(-0.4)]);
    expect(reading).toMatchObject({ label: "Bình thường", statusLevel: "normal", level: "doctor" });
    expect(reading?.change).toBe("Giảm 1,2 SD so với lần đo 01/04/2030");
  });

  it("weighs a rise by indicator", () => {
    expect(readGrowth("weight", "female", BIRTH, [earlier(-1), point(0.2)])).toMatchObject({
      level: "watch",
      advice: "Thay đổi nhanh so với lần đo trước; theo dõi ở lần đo tới.",
    });
    expect(readGrowth("head", "female", BIRTH, [earlier(-1), point(0.2)])?.level).toBe("doctor");
    const length = readGrowth("length", "female", BIRTH, [earlier(-1), point(0.2)]);
    expect(length).toMatchObject({
      level: "normal",
      change: "Tăng 1,2 SD so với lần đo 01/04/2030",
    });
  });

  it("does not compare approximate values", () => {
    const reading = readGrowth("weight", "female", BIRTH, [
      earlier(1, { estimated: true }),
      point(-0.5),
    ]);
    expect(reading).toMatchObject({ change: undefined, level: "normal" });
  });

  it("speaks English", () => {
    const reading = readGrowth("bmi", "male", BIRTH, [point(2.5)], "en");
    expect(reading).toMatchObject({ label: "Overweight" });
    expect(reading?.range).toMatch(/^Normal at 1 year 6 months: \d+\.\d–\d+\.\d kg\/m²$/);
  });

  it("has nothing to say without a z-score, and no range past five years", () => {
    expect(readGrowth("weight", "female", BIRTH, [])).toBeUndefined();
    expect(readGrowth("weight", "female", BIRTH, [point(undefined)])).toBeUndefined();
    expect(
      readGrowth("weight", "female", BIRTH, [point(0, { ageDays: 2000 })])?.range,
    ).toBeUndefined();
  });
});

describe("chartSubtitle", () => {
  it("names the reading and the change since the previous measurement", () => {
    const points = [earlier(0.1, { value: 9.7 }), point(0.2, { value: 9.9 })];
    expect(chartSubtitle("weight", "female", BIRTH, points)).toEqual({
      label: "Bình thường",
      level: "normal",
      detail: "tăng 0,20 kg so với lần đo 01/04/2030",
    });
    expect(chartSubtitle("weight", "female", BIRTH, points, "en").detail).toBe(
      "up 0.20 kg since 1 Apr 2030",
    );
  });

  it("says when a value fell or stayed the same", () => {
    const fell = [earlier(0, { value: 80.4 }), point(-0.3, { value: 80 })];
    expect(chartSubtitle("length", "female", BIRTH, fell).detail).toBe(
      "giảm 0,4 cm so với lần đo 01/04/2030",
    );
    const same = [earlier(0, { value: 45.7 }), point(-0.2, { value: 45.72 })];
    expect(chartSubtitle("head", "female", BIRTH, same).detail).toBe(
      "không đổi so với lần đo 01/04/2030",
    );
  });

  it("gives the normal range after a single measurement, or says there is none", () => {
    expect(chartSubtitle("weight", "female", BIRTH, [point(0)]).detail).toBe(
      "Bình thường ở 1 tuổi 6 tháng: 8,1–11,6 kg",
    );
    expect(chartSubtitle("head", "female", BIRTH, [])).toEqual({
      detail: "Chưa có số đo vòng đầu.",
    });
    expect(chartSubtitle("weight", "female", BIRTH, [point(undefined, { ageDays: 2000 })])).toEqual(
      { detail: "Đo ngày 01/07/2030" },
    );
  });
});
