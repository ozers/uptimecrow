import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * DALGA 3 — tabloya yoğunluk modu eklendi.
 *
 * 100+ monitörü olan Pro/Team hesapları bugün sonsuz kaydırıyor. Compact mod
 * satırı 52px'ten 34px'e indirir: ekranda ~%50 daha fazla satır.
 *
 * Yoğunluk `<Table density="compact">` ile ya da `useTableDensity()` hook'u +
 * `<DensityToggle>` ile kullanıcı tarafından seçilir (localStorage'da kalır).
 * Satır yükseklikleri globals.css'teki --density-row token'ından gelir, yani
 * kart listeleri de aynı ölçüye uyabilir.
 */
type Density = "comfortable" | "compact"

const DensityContext = React.createContext<Density>("comfortable")

const DENSITY_KEY = "uc-table-density"

/** Kullanıcının seçtiği yoğunluk — sayfalar arasında ve yenilemede korunur. */
export function useTableDensity(defaultValue: Density = "comfortable") {
  const [density, setDensity] = React.useState<Density>(() => {
    try {
      const stored = localStorage.getItem(DENSITY_KEY)
      return stored === "compact" || stored === "comfortable" ? stored : defaultValue
    } catch {
      return defaultValue
    }
  })

  const set = React.useCallback((next: Density) => {
    setDensity(next)
    try {
      localStorage.setItem(DENSITY_KEY, next)
    } catch {
      /* storage kapalı olabilir — sessizce yoksay */
    }
  }, [])

  const toggle = React.useCallback(() => {
    set(density === "compact" ? "comfortable" : "compact")
  }, [density, set])

  return { density, setDensity: set, toggle }
}

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & { density?: Density }
>(({ className, density = "comfortable", ...props }, ref) => (
  <DensityContext.Provider value={density}>
    <div
      className={cn(
        "relative w-full overflow-auto",
        density === "compact" && "density-compact",
      )}
    >
      <table
        ref={ref}
        data-density={density}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  </DensityContext.Provider>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, style, ...props }, ref) => (
  <tr
    ref={ref}
    style={{ height: "var(--density-row)", ...style }}
    className={cn(
      "border-b transition-colors duration-1 ease-out hover:bg-accent/60 data-[state=selected]:bg-muted cursor-default",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-2 text-left align-middle text-xs font-semibold uppercase tracking-widest text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, style, ...props }, ref) => (
  <td
    ref={ref}
    style={{ paddingTop: "var(--density-cell-y)", paddingBottom: "var(--density-cell-y)", ...style }}
    className={cn(
      "px-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  DensityContext,
}
export type { Density }
