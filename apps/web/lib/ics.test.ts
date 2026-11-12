import { describe, expect, it } from "vitest";

import { buildCalendar, escapeText, foldLine } from "./ics";

const NOW = new Date("2030-03-20T01:02:03.456Z");

describe("escapeText", () => {
  it("escapes backslashes, semicolons, commas and newlines", () => {
    expect(escapeText("a\\b;c,d\ne\r\nf")).toBe("a\\\\b\\;c\\,d\\ne\\nf");
  });
});

describe("foldLine", () => {
  it("leaves short lines alone", () => {
    expect(foldLine("SUMMARY:short")).toBe("SUMMARY:short");
  });

  it("folds at 75 octets with CRLF and a leading space", () => {
    const folded = foldLine(`DESCRIPTION:${"x".repeat(200)}`);
    const parts = folded.split("\r\n");
    expect(parts[0]).toHaveLength(75);
    expect(parts.slice(1).every((p) => p.startsWith(" ") && p.length <= 75)).toBe(true);
    expect(parts.map((p, i) => (i === 0 ? p : p.slice(1))).join("")).toBe(
      `DESCRIPTION:${"x".repeat(200)}`,
    );
  });

  it("counts UTF-8 bytes and never splits a Vietnamese character", () => {
    const line = `SUMMARY:${"Lịch tiêm cho bé ".repeat(8)}`;
    const encoder = new TextEncoder();
    const parts = foldLine(line).split("\r\n");
    expect(parts.every((p) => encoder.encode(p).length <= 75)).toBe(true);
    expect(parts.map((p, i) => (i === 0 ? p : p.slice(1))).join("")).toBe(line);
  });
});

describe("buildCalendar", () => {
  const ics = buildCalendar(
    [
      {
        uid: "a@notch",
        date: "2030-01-31",
        summary: "Lịch tiêm cho bé",
        description: "Mở Notch, xem chi tiết",
      },
      { uid: "b@notch", date: "2030-12-31", summary: "Lịch tiêm cho bé" },
    ],
    { name: "Notch", now: NOW, alarms: [{ trigger: "-P6DT15H", text: "Còn 1 tuần" }] },
  );
  const lines = ics.split("\r\n");

  it("uses CRLF everywhere and ends with a line break", () => {
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });

  it("writes all-day events ending the next day, across month and year ends", () => {
    expect(lines).toContain("DTSTART;VALUE=DATE:20300131");
    expect(lines).toContain("DTEND;VALUE=DATE:20300201");
    expect(lines).toContain("DTEND;VALUE=DATE:20310101");
  });

  it("includes a stamp, escaped text and one alarm per event", () => {
    expect(lines).toContain("DTSTAMP:20300320T010203Z");
    expect(lines).toContain("DESCRIPTION:Mở Notch\\, xem chi tiết");
    expect(lines.filter((l) => l === "BEGIN:VALARM")).toHaveLength(2);
    expect(lines).toContain("TRIGGER:-P6DT15H");
  });

  it("is a well-formed calendar without events", () => {
    const empty = buildCalendar([], { name: "Notch", now: NOW });
    expect(empty.split("\r\n").filter(Boolean)).toEqual([
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Notch//Vaccination appointments//VI",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Notch",
      "END:VCALENDAR",
    ]);
  });
});
