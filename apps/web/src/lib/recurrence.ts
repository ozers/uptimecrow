/**
 * DALGA 3 — tekrarlayan bakım penceresi.
 *
 * Bugün "her salı 02:00–04:00" için kullanıcı her hafta elle pencere açıyor.
 * En sık istenen özellik ve arayüzde tek onay kutusu + gün seçimiyle çözülür.
 *
 * Model kararı: RRULE gibi tam bir tekrar dili GEREKMİYOR. İki kip yeterli:
 *  · weekly  — haftanın bir günü, aynı saatte
 *  · monthly — ayın belirli günü (1–28; 29-31 ay atlamalarına yol açar)
 * Bitiş: belirli bir tarihe kadar ya da N tekrar sonra ya da süresiz.
 *
 * Backend sözleşmesi (öneri):
 *   recurrence: null | {
 *     freq: "weekly" | "monthly",
 *     byWeekday?: 0..6,      // weekly
 *     byMonthDay?: 1..28,    // monthly
 *     until?: string | null, // ISO
 *     count?: number | null,
 *   }
 * Scheduler her pencere kapandığında sonraki örneği üretir (materialize),
 * yani sorgu tarafı bugünkü haliyle çalışmaya devam eder.
 */
// The shape is owned by the shared zod schema, which is also what the API
// validates against — a second declaration here would drift the moment one side
// gains a field.
import type { Recurrence } from "@uptimecrow/shared";

export type { Recurrence };
export type RecurrenceFreq = Recurrence["freq"];

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** İnsan diline çevir: "Her salı 02:00 · 8 tekrar" */
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
 * Sonraki N örneğin başlangıç zamanını üretir — formda önizleme için.
 * Saat/dakika ilk pencereden alınır; DST geçişlerinde yerel saat korunur.
 */
export function nextOccurrences(
  recurrence: Recurrence,
  startIso: string,
  limit = 3,
): Date[] {
  const start = new Date(startIso);
  const out: Date[] = [];
  const cursor = new Date(start);

  const guard = 400; // sonsuz döngü emniyeti
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
