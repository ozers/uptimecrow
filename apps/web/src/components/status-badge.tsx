import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MonitorStatus, IncidentStatus } from "@uptimecrow/shared";
import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const monitorStatusConfig: Record<
  MonitorStatus,
  { label: string; variant: BadgeVariant; dot: string }
> = {
  up: { label: "Up", variant: "success", dot: "bg-success" },
  down: { label: "Down", variant: "destructive", dot: "bg-danger" },
  degraded: { label: "Degraded", variant: "warning", dot: "bg-warning" },
  unknown: { label: "Unknown", variant: "outline", dot: "bg-muted-foreground" },
};

const incidentStatusConfig: Record<
  IncidentStatus,
  { label: string; variant: BadgeVariant; dot: string }
> = {
  investigating: { label: "Investigating", variant: "destructive", dot: "bg-danger" },
  identified: { label: "Identified", variant: "warning", dot: "bg-warning" },
  monitoring: { label: "Monitoring", variant: "info", dot: "bg-info" },
  resolved: { label: "Resolved", variant: "success", dot: "bg-success" },
};

function DotBadge({
  label,
  variant,
  dot,
}: {
  label: string;
  variant: BadgeVariant;
  dot: string;
}) {
  return (
    <Badge variant={variant} className="gap-1.5">
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </Badge>
  );
}

export function MonitorStatusBadge({ status }: { status: MonitorStatus }) {
  const config = monitorStatusConfig[status];
  return <DotBadge {...config} />;
}

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  const config = incidentStatusConfig[status];
  return <DotBadge {...config} />;
}
