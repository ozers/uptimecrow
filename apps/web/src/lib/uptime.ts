// Single source of truth for uptime-percentage colour thresholds.
// ≥99% is healthy (green) — two-nines is a fine month; 95–99% is degraded
// (amber); below 95% is a real problem (red). Previously the green cutoff was
// 99.9%, which painted perfectly healthy 99.8% services amber as if something
// were wrong. Keep the dashboard, monitors list, and status page in agreement.

export function uptimeBarClass(pct: number): string {
  return pct >= 99 ? "bg-success" : pct >= 95 ? "bg-warning" : "bg-danger";
}

export function uptimeTextClass(pct: number): string {
  return pct >= 99
    ? "text-success-foreground"
    : pct >= 95
      ? "text-warning-foreground"
      : "text-danger-foreground";
}
