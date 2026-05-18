import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Globe,
  Heart,
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMonitors } from "@/lib/queries/monitors";
import { useStatusPages } from "@/lib/queries/status-pages";
import { useHeartbeats } from "@/lib/queries/heartbeats";
import { useOrgSettings, hasNotificationChannel } from "@/lib/queries/settings";
import { toast } from "sonner";

const DISMISS_KEY = "uc-onboarding-dismissed";

export function isOnboardingDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DISMISS_KEY) === "1";
}

export function restartOnboarding() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DISMISS_KEY);
  window.localStorage.removeItem(DISMISS_KEY + "-celebrated");
  window.dispatchEvent(new Event("uc-onboarding-restart"));
}

type Step = {
  id: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  to: string;
  done: boolean;
  optional?: boolean;
};

export function SetupChecklist() {
  const { data: monitors, isLoading: l1 } = useMonitors();
  const { data: statusPages, isLoading: l2 } = useStatusPages();
  const { data: heartbeats, isLoading: l3 } = useHeartbeats();
  const { data: settings, isLoading: l4 } = useOrgSettings();

  const [dismissed, setDismissed] = useState(isOnboardingDismissed);
  const [expanded, setExpanded] = useState(false);

  // Listen for restart events from Settings page
  useEffect(() => {
    const handler = () => setDismissed(false);
    window.addEventListener("uc-onboarding-restart", handler);
    return () => window.removeEventListener("uc-onboarding-restart", handler);
  }, []);

  const loading = l1 || l2 || l3 || l4;

  const steps: Step[] = [
    {
      id: "monitor",
      icon: Activity,
      title: "Add your first monitor",
      desc: "Ping any HTTP, TCP, or keyword endpoint on a schedule.",
      to: "/dashboard/monitors/new",
      done: (monitors?.length ?? 0) > 0,
    },
    {
      id: "notify",
      icon: Bell,
      title: "Connect a notification channel",
      desc: "Slack, Discord, email, PagerDuty, or webhook — pick at least one.",
      to: "/dashboard/settings",
      done: hasNotificationChannel(settings),
    },
    {
      id: "status",
      icon: Globe,
      title: "Create a status page",
      desc: "A public, pre-rendered page that stays online even if you don't.",
      to: "/dashboard/status-pages/new",
      done: (statusPages?.length ?? 0) > 0,
    },
    {
      id: "heartbeat",
      icon: Heart,
      title: "Monitor a cron job",
      desc: "Add one curl line to any scheduled task. Get paged when it stops.",
      to: "/dashboard/heartbeats",
      done: (heartbeats?.length ?? 0) > 0,
      optional: true,
    },
  ];

  const requiredSteps = steps.filter((s) => !s.optional);
  const completedRequired = requiredSteps.filter((s) => s.done).length;
  const allRequiredDone = completedRequired === requiredSteps.length;
  const totalDone = steps.filter((s) => s.done).length;
  const progressPct = (completedRequired / requiredSteps.length) * 100;

  // Auto-celebrate + dismiss once all required steps are done
  useEffect(() => {
    if (loading || dismissed) return;
    if (!allRequiredDone) return;
    const celebrated =
      window.localStorage.getItem(DISMISS_KEY + "-celebrated") === "1";
    if (celebrated) return;
    window.localStorage.setItem(DISMISS_KEY + "-celebrated", "1");
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
    toast.success("You're all set! UptimeCrow is monitoring your services.", {
      icon: <Sparkles className="h-4 w-4" />,
      duration: 5000,
    });
  }, [allRequiredDone, dismissed, loading]);

  if (loading || dismissed) return null;

  const nextStep = steps.find((s) => !s.done && !s.optional) ?? steps.find((s) => !s.done);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="border-b border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-2.5 md:px-6">
        {/* Compact bar */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center gap-3 text-left"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider">
              Get started
            </span>
          </div>

          <div className="hidden flex-1 items-center gap-3 sm:flex">
            <div className="h-1.5 max-w-[200px] flex-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">
              {totalDone} / {steps.length}
            </span>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            {nextStep && !expanded && (
              <Link
                to={nextStep.to}
                onClick={(e) => e.stopPropagation()}
                className="hidden items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 md:flex"
              >
                {nextStep.done ? "Continue" : nextStep.title}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
            <span className="text-muted-foreground">
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={handleDismiss}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  handleDismiss(e as unknown as React.MouseEvent);
                }
              }}
              className="ml-1 cursor-pointer rounded p-0.5 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Dismiss setup guide"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          </div>
        </button>

        {/* Expanded panel */}
        {expanded && (
          <div className="mt-3 grid grid-cols-1 gap-2 pb-1 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <Link
                  key={step.id}
                  to={step.to}
                  className={cn(
                    "group rounded-lg border px-3 py-2.5 transition-all",
                    step.done
                      ? "border-success/20 bg-success/5"
                      : "border-border bg-card hover:border-primary/30 hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                        step.done
                          ? "bg-success/20 text-success-foreground"
                          : "border-2 border-border bg-background text-muted-foreground group-hover:border-primary/50 group-hover:text-primary",
                      )}
                    >
                      {step.done ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Icon className="h-2.5 w-2.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={cn(
                            "text-xs font-semibold leading-tight",
                            step.done && "text-muted-foreground line-through decoration-muted-foreground/40",
                          )}
                        >
                          {step.title}
                        </p>
                        {step.optional && !step.done && (
                          <span className="rounded border border-border px-1 py-px text-[9px] font-medium uppercase tracking-wide text-muted-foreground/70">
                            opt
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
