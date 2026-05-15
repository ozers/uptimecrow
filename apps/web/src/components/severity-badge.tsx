import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IncidentSeverity } from "@uptimecrow/shared";

const severityConfig: Record<IncidentSeverity, { label: string; className: string }> = {
  minor: { label: "Minor", className: "bg-warning/10 text-warning-foreground border-warning/25" },
  major: { label: "Major", className: "bg-warning/15 text-warning-foreground border-warning/40" },
  critical: { label: "Critical", className: "bg-danger/15 text-danger-foreground border-danger/30" },
};

export function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const config = severityConfig[severity];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
