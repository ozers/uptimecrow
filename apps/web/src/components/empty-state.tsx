import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CrowMark } from "@/components/logo";
import { cn } from "@/lib/utils";

/**
 * Empty states, split by what the emptiness means.
 *
 * Three kinds of empty are not the same thing:
 *  · `first-run`  — nothing exists yet. Teach, then offer one action:
 *                   the crow mark and a primary button.
 *  · `good-news`  — data exists and the result is empty, which is good news
 *                   (no open incidents). Reassure: green tone, optional action.
 *  · `filtered`   — a filter matched nothing. The job is to clear it:
 *                   neutral tone, "Clear filters".
 *
 * No alpha clips: icons are `text-text3`, prose is `text-muted-foreground`.
 */
type EmptyVariant = "first-run" | "good-news" | "filtered";

interface EmptyStateProps {
  /** Which kind of empty this is. Defaults to first-run. */
  variant?: EmptyVariant;
  /** Optional lucide icon. When omitted, first-run shows the crow mark. */
  icon?: LucideIcon;
  /** Small mono uppercase label above the title. */
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

const TONE: Record<EmptyVariant, { wrap: string; icon: string; eyebrow: string }> = {
  "first-run": {
    wrap: "border-y border-border",
    icon: "text-text3",
    eyebrow: "text-muted-foreground",
  },
  "good-news": {
    wrap: "border-y border-l-2 border-l-success border-y-success/40 bg-success/5",
    icon: "text-success-foreground",
    eyebrow: "text-success-foreground",
  },
  filtered: {
    wrap: "border-y border-dashed border-border",
    icon: "text-text3",
    eyebrow: "text-muted-foreground",
  },
};

export function EmptyState({
  variant = "first-run",
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const tone = TONE[variant];
  const compact = variant === "filtered";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        compact ? "py-10" : "py-16",
        tone.wrap,
        className,
      )}
    >
      {Icon ? (
        <Icon className={cn("mb-5 h-10 w-10", tone.icon)} aria-hidden="true" />
      ) : variant === "first-run" ? (
        <CrowMark size={48} className="mb-5" />
      ) : null}
      {eyebrow && (
        <p className={cn("font-mono text-[11px] uppercase tracking-[0.16em]", tone.eyebrow)}>
          {eyebrow}
        </p>
      )}
      <h3
        className={cn(
          "mt-2 font-display font-bold tracking-[-0.02em]",
          compact ? "text-lg" : "text-xl",
        )}
      >
        {title}
      </h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className={compact ? "mt-4" : "mt-6"}>{action}</div>}
    </div>
  );
}
