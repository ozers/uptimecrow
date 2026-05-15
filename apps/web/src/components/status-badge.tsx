import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MonitorStatus, IncidentStatus } from "@uptimecrow/shared";

const monitorStatusConfig: Record<MonitorStatus, { label: string; className: string }> = {
  up: { label: "Up", className: "bg-success/15 text-success-foreground border-success/30" },
  down: { label: "Down", className: "bg-danger/15 text-danger-foreground border-danger/30" },
  degraded: { label: "Degraded", className: "bg-warning/15 text-warning-foreground border-warning/30" },
  unknown: { label: "Unknown", className: "bg-muted text-muted-foreground border-border" },
};

const incidentStatusConfig: Record<IncidentStatus, { label: string; className: string }> = {
  investigating: { label: "Investigating", className: "bg-danger/15 text-danger-foreground border-danger/30" },
  identified: { label: "Identified", className: "bg-warning/15 text-warning-foreground border-warning/30" },
  monitoring: { label: "Monitoring", className: "bg-warning/10 text-warning-foreground border-warning/25" },
  resolved: { label: "Resolved", className: "bg-success/15 text-success-foreground border-success/30" },
};

export function MonitorStatusBadge({ status }: { status: MonitorStatus }) {
  const config = monitorStatusConfig[status];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  const config = incidentStatusConfig[status];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
