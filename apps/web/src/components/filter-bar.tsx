import * as React from "react";
import { Search, X, Rows3, Rows4 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Density } from "@/components/ui/table";

/**
 * DALGA 3 — liste sayfaları için tek şeritlik filtre çubuğu.
 *
 * Bugün Monitors/Incidents listelerinde arama da filtre de yok; 20 monitörden
 * sonra sayfa kullanılamaz hale geliyor. Bu çubuk üç şeyi tek satırda verir:
 * arama, durum segmentleri (sayaçlı), yoğunluk anahtarı.
 *
 * Tasarım kuralları:
 *  · Segmentler sayaç gösterir — "Down 0" görmek de bilgidir.
 *  · Aktif segment brand rengiyle işaretlenir, seçili olmayanlar nötr.
 *  · Aramada değer varsa temizleme butonu görünür (mobilde 44px hedef).
 *  · Mobilde: arama tam genişlik üstte, segmentler altında yatay kaydırmalı.
 *  · Yoğunluk anahtarı yalnızca md+ görünür — mobilde satırlar kart olur.
 */
export interface FilterSegment<T extends string> {
  value: T;
  label: string;
  count?: number;
  /** Segment sayacı için ton: durum renkleri. */
  tone?: "neutral" | "success" | "warning" | "danger";
}

const TONE_ACTIVE: Record<NonNullable<FilterSegment<string>["tone"]>, string> = {
  neutral: "border-foreground/25 bg-accent text-foreground",
  success: "border-success/40 bg-success/10 text-success-foreground",
  warning: "border-warning/40 bg-warning/10 text-warning-foreground",
  danger: "border-danger/40 bg-danger/10 text-danger-foreground",
};

export interface FilterBarProps<T extends string> {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  segments?: FilterSegment<T>[];
  activeSegment?: T;
  onSegmentChange?: (value: T) => void;
  density?: Density;
  onDensityToggle?: () => void;
  /** Sağa eklenecek ekstra aksiyon (ör. "Add monitor"). */
  children?: React.ReactNode;
  className?: string;
}

export function FilterBar<T extends string>({
  query,
  onQueryChange,
  placeholder = "Search…",
  segments,
  activeSegment,
  onSegmentChange,
  density,
  onDensityToggle,
  children,
  className,
}: FilterBarProps<T>) {
  const inputId = React.useId();

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border py-3 md:flex-row md:items-center",
        className,
      )}
    >
      {/* Arama */}
      <div className="relative md:w-64">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text3"
          aria-hidden="true"
        />
        <Input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-9 pl-9 pr-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Clear search"
            className="focus-ring touch-target absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text3 transition-colors duration-1 hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Durum segmentleri */}
      {segments && segments.length > 0 && (
        <div
          role="group"
          aria-label="Filter by status"
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5"
        >
          {segments.map((s) => {
            const active = s.value === activeSegment;
            return (
              <button
                key={s.value}
                type="button"
                aria-pressed={active}
                onClick={() => onSegmentChange?.(s.value)}
                className={cn(
                  "focus-ring flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors duration-1 ease-out",
                  active
                    ? TONE_ACTIVE[s.tone ?? "neutral"]
                    : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {s.label}
                {s.count != null && <span className="tnum opacity-70">{s.count}</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 md:ml-auto">
        {/* Yoğunluk anahtarı — sadece desktop */}
        {density && onDensityToggle && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDensityToggle}
            aria-label={
              density === "compact" ? "Switch to comfortable rows" : "Switch to compact rows"
            }
            title={density === "compact" ? "Comfortable rows" : "Compact rows"}
            className="hidden md:inline-flex"
          >
            {density === "compact" ? (
              <Rows3 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Rows4 className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        )}
        {children}
      </div>
    </div>
  );
}

/**
 * Basit istemci tarafı arama yardımcısı — alanları birleştirip küçük harfe
 * indirir. Sunucu tarafı arama gelene kadar liste sayfaları bunu kullanır.
 */
export function matchesQuery(query: string, ...fields: (string | null | undefined)[]) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => (f ?? "").toLowerCase().includes(q));
}
