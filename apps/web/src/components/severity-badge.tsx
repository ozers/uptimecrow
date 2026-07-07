import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IncidentSeverity } from "@uptimecrow/shared";
import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const severityConfig: Record<
  IncidentSeverity,
  { label: string; variant: BadgeVariant; dot: string }
> = {
  minor: { label: "Minor", variant: "warning", dot: "bg-warning" },
  major: { label: "Major", variant: "warning", dot: "bg-warning" },
  critical: { label: "Critical", variant: "destructive", dot: "bg-danger" },
};

export function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const config = severityConfig[severity];
  return (
    <Badge variant={config.variant} className="gap-1.5">
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </Badge>
  );
}
