import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MonitorStatus, IncidentStatus } from "@uptimecrow/shared";

const monitorStatusConfig: Record<MonitorStatus, { label: string; className: string }> = {
  up: { label: "Up", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  down: { label: "Down", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  degraded: { label: "Degraded", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  unknown: { label: "Unknown", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
};

const incidentStatusConfig: Record<IncidentStatus, { label: string; className: string }> = {
  investigating: { label: "Investigating", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  identified: { label: "Identified", className: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  monitoring: { label: "Monitoring", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  resolved: { label: "Resolved", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
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
