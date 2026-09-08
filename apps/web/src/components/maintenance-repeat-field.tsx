import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
  WEEKDAY_LABELS,
  describeRecurrence,
  nextOccurrences,
  type Recurrence,
  type RecurrenceFreq,
} from "@/lib/recurrence";

/**
 * DALGA 3 — bakım penceresi formuna eklenen tekrar alanı.
 *
 * MaintenanceList içindeki Dialog formuna, scheduledEnd alanının hemen altına
 * yerleştirilir:
 *
 *   <RepeatField
 *     value={form.recurrence}
 *     startIso={fromLocalInputValue(form.scheduledStart)}
 *     onChange={(recurrence) => setForm((f) => ({ ...f, recurrence }))}
 *   />
 *
 * Kapalıyken tek onay kutusu — mevcut formu uzatmıyor. Açıldığında kip,
 * gün seçimi, bitiş ve sonraki üç tarihin önizlemesi görünür. Önizleme
 * kritik: "her ayın 31'i" gibi seçimlerin ne demek olduğunu kullanıcı
 * kaydetmeden görür.
 */
export function RepeatField({
  value,
  startIso,
  onChange,
  className,
}: {
  value: Recurrence | null;
  startIso: string;
  onChange: (recurrence: Recurrence | null) => void;
  className?: string;
}) {
  const enabled = !!value;
  const startDate = React.useMemo(() => {
    const d = new Date(startIso);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }, [startIso]);

  const enable = (on: boolean) => {
    if (!on) return onChange(null);
    onChange({
      freq: "weekly",
      byWeekday: startDate.getDay(),
      until: null,
      count: null,
    });
  };

  const patch = (next: Partial<Recurrence>) => {
    if (!value) return;
    onChange({ ...value, ...next });
  };

  const preview = value ? nextOccurrences(value, startIso, 3) : [];

  return (
    <div className={cn("space-y-4 border-t border-border pt-4", className)}>
      <label className="focus-within:outline-none flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => enable(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--brand))]"
        />
        <span className="min-w-0">
          <span className="block text-sm font-semibold">Repeat this window</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {enabled ? describeRecurrence(value, startIso) : "Tek seferlik pencere"}
          </span>
        </span>
      </label>

      {enabled && value && (
        <div className="space-y-4 pl-7">
          {/* Kip */}
          <div role="group" aria-label="Repeat frequency" className="flex gap-1.5">
            {(["weekly", "monthly"] as RecurrenceFreq[]).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={value.freq === f}
                onClick={() =>
                  patch(
                    f === "weekly"
                      ? { freq: f, byWeekday: startDate.getDay(), byMonthDay: undefined }
                      : { freq: f, byMonthDay: Math.min(28, startDate.getDate()), byWeekday: undefined },
                  )
                }
                className={cn(
                  "focus-ring rounded-md border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors duration-1",
                  value.freq === f
                    ? "border-brand/40 bg-brand/10 text-brand"
                    : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {f === "weekly" ? "Weekly" : "Monthly"}
              </button>
            ))}
          </div>

          {/* Gün seçimi */}
          {value.freq === "weekly" ? (
            <div role="group" aria-label="Day of week" className="flex flex-wrap gap-1.5">
              {WEEKDAY_LABELS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={value.byWeekday === i}
                  onClick={() => patch({ byWeekday: i })}
                  className={cn(
                    "focus-ring h-9 w-11 rounded-md border font-mono text-[11px] uppercase transition-colors duration-1",
                    value.byWeekday === i
                      ? "border-brand/40 bg-brand/10 text-brand"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <Field
              label="Day of month"
              htmlFor="byMonthDay"
              hint="1–28 arası. 29–31 bazı aylarda atlanır, bu yüzden kabul edilmiyor."
            >
              <Input
                id="byMonthDay"
                type="number"
                min={1}
                max={28}
                className="tnum w-24"
                value={value.byMonthDay ?? 1}
                onChange={(e) =>
                  patch({ byMonthDay: Math.max(1, Math.min(28, Number(e.target.value) || 1)) })
                }
              />
            </Field>
          )}

          {/* Bitiş */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ends on" htmlFor="until" adornment="optional">
              <Input
                id="until"
                type="date"
                value={value.until ? value.until.slice(0, 10) : ""}
                onChange={(e) =>
                  patch({
                    until: e.target.value ? new Date(e.target.value).toISOString() : null,
                    count: e.target.value ? null : value.count,
                  })
                }
              />
            </Field>
            <Field label="Or after" htmlFor="count" adornment="occurrences">
              <Input
                id="count"
                type="number"
                min={2}
                max={104}
                placeholder="∞"
                className="tnum"
                value={value.count ?? ""}
                onChange={(e) =>
                  patch({
                    count: e.target.value ? Number(e.target.value) : null,
                    until: e.target.value ? null : value.until,
                  })
                }
              />
            </Field>
          </div>

          {/* Önizleme */}
          {preview.length > 0 && (
            <div className="rounded-lg border border-dashed border-border p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text3">
                Next windows
              </p>
              <ul className="mt-2 space-y-1">
                {preview.map((d) => (
                  <li key={d.toISOString()} className="font-mono tnum text-xs text-muted-foreground">
                    {d.toLocaleString(undefined, {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
