import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IncidentSeverity } from "@uptimecrow/shared";

const severityConfig: Record<IncidentSeverity, { label: string; className: string }> = {
  minor: { label: "Minor", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  major: { label: "Major", className: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  critical: { label: "Critical", className: "bg-red-500/15 text-red-400 border-red-500/30" },
};

export function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const config = severityConfig[severity];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
