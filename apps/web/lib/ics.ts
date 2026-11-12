/**
 * Minimal iCalendar (RFC 5545) writer for all-day events with reminders.
 * Written by hand to stay small: escaping, CRLF line endings and 75-octet
 * line folding are the parts calendar apps are strict about.
 */

export interface CalendarEvent {
  /** Stable across exports, so re-importing updates instead of duplicating. */
  readonly uid: string;
  /** All-day event date, YYYY-MM-DD. */
  readonly date: string;
  readonly summary: string;
  readonly description?: string;
}

export interface CalendarOptions {
  readonly name: string;
  /** Export time, for DTSTAMP. */
  readonly now: Date;
  /**
   * Reminders before the start of the day, as RFC 5545 durations. All-day
   * events start at midnight, so "-P6DT15H" fires at 09:00 a week before.
   */
  readonly alarms?: readonly { readonly trigger: string; readonly text: string }[];
}

/** Escapes TEXT values: backslash, semicolon, comma and newlines. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Folds a content line at 75 octets (UTF-8), never splitting a character. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    // The first line holds 75 octets; continuation lines start with a space, so 74.
    const limit = parts.length === 0 ? 75 : 74;
    if (size + bytes > limit) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += bytes;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

const compactDate = (date: string) => date.replaceAll("-", "");

function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function stamp(now: Date): string {
  return now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export function buildCalendar(events: readonly CalendarEvent[], options: CalendarOptions): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Notch//Vaccination appointments//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(options.name)}`,
  ];
  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${stamp(options.now)}`,
      `DTSTART;VALUE=DATE:${compactDate(event.date)}`,
      `DTEND;VALUE=DATE:${compactDate(nextDay(event.date))}`,
      `SUMMARY:${escapeText(event.summary)}`,
      ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
      "TRANSP:TRANSPARENT",
    );
    for (const alarm of options.alarms ?? []) {
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `TRIGGER:${alarm.trigger}`,
        `DESCRIPTION:${escapeText(alarm.text)}`,
        "END:VALARM",
      );
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
