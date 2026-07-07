import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CrowMark } from "@/components/logo";

interface EmptyStateProps {
  /** Optional lucide icon. When omitted, the crow mark is shown. */
  icon?: LucideIcon;
  /** Small mono uppercase label above the title. */
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, eyebrow, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center border-y border-border px-6 py-16 text-center">
      {Icon ? (
        <Icon className="mb-5 h-10 w-10 text-muted-foreground/40" />
      ) : (
        <CrowMark size={48} className="mb-5 opacity-90" />
      )}
      {eyebrow && (
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </p>
      )}
      <h3 className="mt-2 font-display text-xl font-bold tracking-[-0.02em]">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
