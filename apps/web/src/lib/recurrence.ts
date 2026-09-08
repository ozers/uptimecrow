/**
 * Recurring maintenance windows.
 *
 * A "every Tuesday 02:00–04:00" slot meant creating a window by hand every
 * week. In the UI this is one checkbox and a day picker.
 *
 * Deliberately not RRULE. Two modes cover what people actually schedule:
 *  · weekly  — one weekday, same time
 *  · monthly — a day of the month (1–28; 29-31 would skip shorter months)
 * Ending: on a date, after N repeats, or never.
 *
 * Backend contract:
 *   recurrence: null | {
 *     freq: "weekly" | "monthly",
 *     byWeekday?: 0..6,      // weekly
 *     byMonthDay?: 1..28,    // monthly
 *     until?: string | null, // ISO
 *     count?: number | null,
 *   }
 * The scheduler materialises the next window when the current one closes, so
 * every query that asks "is a window active right now?" is unchanged.
 */
// The shape is owned by the shared zod schema, which is also what the API
// validates against — a second declaration here would drift the moment one side
// gains a field.
import type { Recurrence } from "@uptimecrow/shared";

export type { Recurrence };
export type RecurrenceFreq = Recurrence["freq"];

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Human wording: "Every Tue at 02:00 · 8 times" */
export function describeRecurrence(
  recurrence: Recurrence | null | undefined,
  startIso?: string,
): string {
  if (!recurrence) return "Does not repeat";

  const time = startIso
    ? new Date(startIso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : null;

  let base: string;
  if (recurrence.freq === "weekly") {
    const day = WEEKDAY_LABELS[recurrence.byWeekday ?? 0];
    base = `Every ${day}`;
  } else {
    const d = recurrence.byMonthDay ?? 1;
    base = `Monthly on day ${d}`;
  }

  const parts = [time ? `${base} at ${time}` : base];
  if (recurrence.count) parts.push(`${recurrence.count} times`);
  else if (recurrence.until) {
    parts.push(`until ${new Date(recurrence.until).toLocaleDateString()}`);
  }
  return parts.join(" · ");
}

/**
 * Start times of the next N occurrences, for the preview in the form. The
 * time of day comes from the first window and is kept across DST changes.
 */
export function nextOccurrences(
  recurrence: Recurrence,
  startIso: string,
  limit = 3,
): Date[] {
  const start = new Date(startIso);
  const out: Date[] = [];
  const cursor = new Date(start);

  const guard = 400; // infinite-loop guard
  let steps = 0;

  while (out.length < limit && steps < guard) {
    steps += 1;
    if (recurrence.freq === "weekly") {
      cursor.setDate(cursor.getDate() + 7);
    } else {
      cursor.setMonth(cursor.getMonth() + 1);
      if (recurrence.byMonthDay) cursor.setDate(recurrence.byMonthDay);
    }
    if (recurrence.until && cursor > new Date(recurrence.until)) break;
    out.push(new Date(cursor));
    if (recurrence.count && out.length + 1 >= recurrence.count) break;
  }

  return out;
}
