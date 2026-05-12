import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Plus,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Zap,
  Heart,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAN_LIMITS } from "@uptimecrow/shared";
import type { Plan } from "@uptimecrow/shared";
import { useMonitors } from "@/lib/queries/monitors";
import { useIncidents } from "@/lib/queries/incidents";
import { useStatusPages } from "@/lib/queries/status-pages";
import { useUptime } from "@/lib/queries/analytics";
import { useHeartbeats } from "@/lib/queries/heartbeats";
import { useAuthStore } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IncidentStatusBadge } from "@/components/status-badge";
import { SeverityBadge } from "@/components/severity-badge";
import { RelativeTime } from "@/components/relative-time";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Skeleton ────────────────────────────────────────────────────────────────

function OverviewSkeleton() {
  return (
    <div>
      <Skeleton className="mb-6 h-[72px] w-full rounded-xl" />
      <div className="mb-8 flex items-center gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-28" />
        ))}
      </div>
      <div className="mb-2 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="mb-8 divide-y divide-border border-t border-b border-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-2 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="mb-2 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="divide-y divide-border border-t border-b border-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

function Onboarding({ hasStatusPages }: { hasStatusPages: boolean }) {
  const steps: {
    icon: React.ElementType;
    to: string;
    title: string;
    desc: string;
    done: boolean;
    optional?: boolean;
  }[] = [
    {
      icon: Activity,
      to: "/dashboard/monitors/new",
      title: "Add your first monitor",
      desc: "Paste any HTTP URL or TCP host — UptimeCrow checks it every minute and creates an incident automatically when it goes down.",
      done: false,
    },
    {
      icon: Globe,
      to: "/dashboard/status-pages/new",
      title: "Create a status page",
      desc: "A public page where your users can see real-time service status. Pre-rendered so it stays online even when your origin is down.",
      done: hasStatusPages,
    },
    {
      icon: Heart,
      to: "/dashboard/heartbeats",
      title: "Monitor cron jobs with heartbeats",
      desc: "Your scheduled tasks ping a unique URL when they run. If no ping arrives in time, UptimeCrow alerts you.",
      done: false,
      optional: true,
    },
  ];

  const requiredSteps = steps.filter((s) => !s.optional);
  const completedRequired = requiredSteps.filter((s) => s.done).length;

  return (
    <div>
      <div className="mb-8 rounded-xl border border-border px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Welcome to UptimeCrow
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up monitoring in a few steps — takes under 2 minutes.
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-primary/10 px-3 py-1">
            <p className="text-xs font-semibold text-primary">
              {completedRequired}/{requiredSteps.length} done
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border border-t border-border">
        {steps.map(({ icon: Icon, to, title, desc, done, optional }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "group flex items-start gap-4 py-5 transition-colors",
              done
                ? "pointer-events-none opacity-50"
                : "hover:text-primary",
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                done
                  ? "border-emerald-400 bg-emerald-400/10"
                  : "border-border group-hover:border-primary",
              )}
            >
              {done ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{title}</p>
                {optional && (
                  <span className="rounded border border-border px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                    optional
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {desc}
              </p>
            </div>
            {!done && (
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Status Banner ────────────────────────────────────────────────────────────

function StatusBanner({
  monitorsDown,
  activeIncidents,
  hasMonitors,
  timestamp,
  onRefetch,
  isRefetching,
}: {
  monitorsDown: number;
  activeIncidents: number;
  hasMonitors: boolean;
  timestamp: number;
  onRefetch: () => void;
  isRefetching: boolean;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  const updatedLabel =
    seconds < 10
      ? "just now"
      : seconds < 60
        ? `${seconds}s ago`
        : `${Math.floor(seconds / 60)}m ago`;

  let bg = "";
  let border = "border-border";
  let dot: React.ReactNode = null;
  let headline = "All systems operational";
  let headlineColor = "";
  let sub = "Everything is running smoothly.";

  if (!hasMonitors) {
    headline = "Dashboard";
    sub = "No monitors configured yet.";
  } else if (monitorsDown > 0) {
    bg = "bg-red-500/5";
    border = "border-red-500/30";
    headlineColor = "text-red-400";
    headline = `${monitorsDown} monitor${monitorsDown > 1 ? "s" : ""} down`;
    sub = "One or more services are unreachable.";
    dot = (
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-400" />
      </span>
    );
  } else if (activeIncidents > 0) {
    bg = "bg-yellow-500/5";
    border = "border-yellow-500/30";
    headlineColor = "text-yellow-400";
    headline = `${activeIncidents} active incident${activeIncidents > 1 ? "s" : ""}`;
    sub = "An incident is currently being tracked.";
    dot = <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-400" />;
  } else if (hasMonitors) {
    dot = <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />;
  }

  return (
    <div
      className={cn(
        "mb-6 flex items-center justify-between gap-4 rounded-xl border px-6 py-5 transition-colors",
        bg,
        border,
      )}
    >
      <div className="flex items-center gap-3">
        {dot}
        <div>
          <p className={cn("font-bold tracking-tight", headlineColor)}>
            {headline}
          </p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </div>
      <button
        onClick={onRefetch}
        disabled={isRefetching}
        className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 cursor-pointer"
      >
        <RefreshCw className={cn("h-3 w-3", isRefetching && "animate-spin")} />
        {isRefetching ? "Refreshing…" : `Updated ${updatedLabel}`}
      </button>
    </div>
  );
}

// ─── Inline Stats Row ─────────────────────────────────────────────────────────

function StatRow({
  items,
}: {
  items: {
    label: string;
    value: string | number;
    color?: string;
    to?: string;
  }[];
}) {
  const navigate = useNavigate();
  return (
    <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2">
      {items.map((item, i) => (
        <button
          key={i}
          onClick={item.to ? () => navigate(item.to!) : undefined}
          className={cn(
            "flex items-baseline gap-1.5 text-sm",
            item.to && "cursor-pointer hover:opacity-80 transition-opacity",
          )}
        >
          <span
            className={cn(
              "text-xl font-bold tabular-nums leading-none tracking-tight",
              item.color ?? "text-foreground",
            )}
          >
            {item.value}
          </span>
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Status Dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    up: "bg-emerald-400",
    down: "bg-red-400",
    degraded: "bg-yellow-400",
    unknown: "bg-zinc-500",
  };
  const color = colorMap[status] ?? "bg-zinc-500";
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {status === "down" && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            color,
          )}
        />
      )}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", color)} />
    </span>
  );
}

// ─── Response Bar ─────────────────────────────────────────────────────────────

function ResponseBar({ ms }: { ms: number | null | undefined }) {
  if (ms == null)
    return (
      <span className="text-xs tabular-nums text-muted-foreground/50">—</span>
    );
  const pct = Math.min(100, (ms / 1500) * 100);
  const barColor =
    ms < 300
      ? "bg-emerald-400"
      : ms < 800
        ? "bg-yellow-400"
        : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
        {ms}ms
      </span>
      <div className="h-1 w-16 rounded-full bg-border">
        <div
          className={cn("h-1 rounded-full", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  badge,
  to,
}: {
  title: string;
  badge?: number;
  to: string;
}) {
  return (
    <div className="mb-0 flex items-center justify-between pb-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
        {badge != null && badge > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500/20 px-1 text-[10px] font-bold text-red-400">
            {badge}
          </span>
        )}
      </div>
      <Link
        to={to}
        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        View all <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ─── Feature Discovery Card ───────────────────────────────────────────────────

function FeatureDiscoveryCard({
  icon: Icon,
  title,
  desc,
  cta,
  to,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  cta: string;
  to: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-dashed border-border px-5 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <Button size="sm" variant="outline" asChild className="shrink-0">
        <Link to={to}>{cta}</Link>
      </Button>
    </div>
  );
}

// ─── Nudge Banner (inline tip) ────────────────────────────────────────────────

function NudgeBanner({
  icon: Icon,
  text,
  cta,
  to,
}: {
  icon: React.ElementType;
  text: React.ReactNode;
  cta: string;
  to: string;
}) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-5 py-3.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="flex-1 text-sm text-muted-foreground">{text}</p>
      <Button size="sm" variant="outline" asChild className="shrink-0">
        <Link to={to}>{cta}</Link>
      </Button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function Overview() {
  const { user } = useAuthStore();
  const {
    data: monitors,
    isLoading: monitorsLoading,
    dataUpdatedAt,
    refetch: refetchMonitors,
    isRefetching,
  } = useMonitors();
  const {
    data: incidents,
    isLoading: incidentsLoading,
    refetch: refetchIncidents,
  } = useIncidents();
  const { data: statusPages, isLoading: statusPagesLoading } = useStatusPages();
  const { data: heartbeats } = useHeartbeats();

  const totalMonitors = monitors?.length ?? 0;
  const hasMonitors = totalMonitors > 0;
  const { data: uptimeData } = useUptime(hasMonitors);

  if (monitorsLoading || incidentsLoading || statusPagesLoading)
    return <OverviewSkeleton />;

  const totalStatusPages = statusPages?.length ?? 0;

  // Show onboarding only when no monitors at all
  if (!hasMonitors) {
    return <Onboarding hasStatusPages={totalStatusPages > 0} />;
  }

  const monitorsDown = monitors?.filter((m) => m.status === "down").length ?? 0;
  const activeIncidents = incidents?.filter((i) => i.status !== "resolved") ?? [];
  const recentIncidents = incidents?.slice(0, 5) ?? [];

  const uptimeMap = new Map(
    uptimeData?.map((u) => [u.monitorId, u]) ?? [],
  );
  const validUptime = uptimeData?.filter((u) => u.uptimePercent != null) ?? [];
  const avgUptime =
    validUptime.length > 0
      ? `${(validUptime.reduce((sum, u) => sum + Number(u.uptimePercent), 0) / validUptime.length).toFixed(2)}%`
      : "—";

  const plan = (user?.plan ?? "free") as Plan;
  const planLimit = PLAN_LIMITS[plan].monitors;

  const handleRefetch = () => {
    refetchMonitors();
    refetchIncidents();
  };

  const SHOW_COUNT = 6;
  const visibleMonitors = monitors?.slice(0, SHOW_COUNT) ?? [];
  const hiddenCount = (monitors?.length ?? 0) - SHOW_COUNT;

  const lateHeartbeats =
    heartbeats?.filter((h) => h.isActive && h.status === "late") ?? [];
  const hasHeartbeats = (heartbeats?.length ?? 0) > 0;

  // Feature discovery: show only when user is "settled in" (has monitors + status pages)
  const isSettledIn = hasMonitors && totalStatusPages > 0;

  return (
    <TooltipProvider>
      <div>
        {/* Status banner */}
        <StatusBanner
          monitorsDown={monitorsDown}
          activeIncidents={activeIncidents.length}
          hasMonitors={hasMonitors}
          timestamp={dataUpdatedAt}
          onRefetch={handleRefetch}
          isRefetching={isRefetching}
        />

        {/* Late heartbeats alert */}
        {lateHeartbeats.length > 0 && (
          <NudgeBanner
            icon={Heart}
            text={
              <>
                <span className="font-semibold text-red-400">
                  {lateHeartbeats.length} heartbeat
                  {lateHeartbeats.length > 1 ? "s" : ""} late
                </span>{" "}
                — a scheduled task hasn't pinged in time.
              </>
            }
            cta="View heartbeats"
            to="/dashboard/heartbeats"
          />
        )}

        {/* Status page nudge — shown when user has monitors but no status page */}
        {!totalStatusPages && (
          <NudgeBanner
            icon={Globe}
            text={
              <>
                <span className="font-medium text-foreground">
                  Share your uptime publicly.
                </span>{" "}
                Create a status page so your users know when services are down.
              </>
            }
            cta="Create status page"
            to="/dashboard/status-pages/new"
          />
        )}

        {/* Inline stats */}
        <StatRow
          items={[
            {
              value: totalMonitors,
              label: `monitor${totalMonitors !== 1 ? "s" : ""}`,
              to: "/dashboard/monitors",
            },
            {
              value: avgUptime,
              label: "avg uptime",
              color: "text-primary",
            },
            {
              value: activeIncidents.length,
              label: `active incident${activeIncidents.length !== 1 ? "s" : ""}`,
              color: activeIncidents.length > 0 ? "text-yellow-400" : undefined,
              to: "/dashboard/incidents",
            },
            {
              value: totalStatusPages,
              label: `status page${totalStatusPages !== 1 ? "s" : ""}`,
              to: "/dashboard/status-pages",
            },
            ...(hasHeartbeats
              ? [
                  {
                    value: heartbeats?.filter((h) => h.status === "healthy").length ?? 0,
                    label: `heartbeat${(heartbeats?.length ?? 0) !== 1 ? "s" : ""} healthy`,
                    color:
                      lateHeartbeats.length > 0 ? "text-red-400" : "text-emerald-400",
                    to: "/dashboard/heartbeats",
                  },
                ]
              : []),
          ]}
        />

        {/* Monitors section */}
        <div className="mb-8">
          <SectionHeader title="Monitor Status" to="/dashboard/monitors" />
          {visibleMonitors.length === 0 ? (
            <div className="border-t border-b border-border py-10 text-center">
              <Activity className="mx-auto mb-3 h-7 w-7 text-muted-foreground/40" />
              <p className="text-sm font-medium">No monitors yet</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Add your first endpoint to start tracking uptime.
              </p>
              <Button size="sm" className="mt-4" asChild>
                <Link to="/dashboard/monitors/new">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Monitor
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border border-t border-b border-border">
              {visibleMonitors.map((monitor) => {
                const uptime = uptimeMap.get(monitor.id);
                const uptimePct =
                  uptime?.uptimePercent != null
                    ? Number(uptime.uptimePercent)
                    : null;
                const uptimeColor =
                  uptimePct == null
                    ? "text-muted-foreground/50"
                    : uptimePct >= 99.9
                      ? "text-emerald-400"
                      : uptimePct >= 99
                        ? "text-yellow-400"
                        : "text-red-400";
                return (
                  <Tooltip key={monitor.id}>
                    <TooltipTrigger asChild>
                      <Link
                        to={`/dashboard/monitors/${monitor.id}`}
                        className="group flex items-center justify-between py-3 transition-colors hover:text-primary"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <StatusDot status={monitor.status} />
                          <span className="truncate text-sm font-medium">
                            {monitor.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-5 shrink-0">
                          {uptimePct != null && (
                            <span
                              className={cn(
                                "w-14 text-right text-xs tabular-nums font-medium",
                                uptimeColor,
                              )}
                            >
                              {uptimePct.toFixed(2)}%
                            </span>
                          )}
                          <ResponseBar ms={monitor.lastResponseMs} />
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      {monitor.url}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
              {hiddenCount > 0 && (
                <Link
                  to="/dashboard/monitors"
                  className="flex items-center gap-1.5 py-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />
                  {hiddenCount} more monitor{hiddenCount > 1 ? "s" : ""}
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Incidents section */}
        <div className="mb-8">
          <SectionHeader
            title="Recent Incidents"
            badge={activeIncidents.length}
            to="/dashboard/incidents"
          />
          {recentIncidents.length === 0 ? (
            <div className="border-t border-b border-border py-10 text-center">
              <ShieldCheck className="mx-auto mb-3 h-7 w-7 text-emerald-400/50" />
              <p className="text-sm font-medium">All clear</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                No incidents recorded.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border border-t border-b border-border">
              {recentIncidents.map((incident) => (
                <Link
                  key={incident.id}
                  to={`/dashboard/incidents/${incident.id}`}
                  className="group flex items-center justify-between gap-4 py-3 transition-colors hover:text-primary"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {incident.status === "resolved" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                    )}
                    <span className="truncate text-sm font-medium">
                      {incident.title}
                    </span>
                    <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                      <IncidentStatusBadge status={incident.status} />
                      <SeverityBadge severity={incident.severity} />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      <RelativeTime date={incident.startedAt} />
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Feature discovery — shown when settled in and hasn't used these features */}
        {isSettledIn && !hasHeartbeats && (
          <div className="mb-8 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Discover
            </p>
            <FeatureDiscoveryCard
              icon={Heart}
              title="Heartbeat monitoring"
              desc="Make your cron jobs and scheduled tasks ping a URL. Get alerted when they stop running."
              cta="Set up a heartbeat"
              to="/dashboard/heartbeats"
            />
            <FeatureDiscoveryCard
              icon={Wrench}
              title="Maintenance windows"
              desc="Schedule planned downtime to stop false alerts and notify your subscribers in advance."
              cta="Schedule a window"
              to="/dashboard/maintenance"
            />
          </div>
        )}

        {/* Upgrade nudge — inline, no card */}
        {plan === "free" &&
          totalMonitors >= Math.floor(planLimit * 0.66) && (
            <div className="flex items-center justify-between border-t border-border pt-5">
              <div className="flex items-center gap-2.5">
                <Zap className="h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Using{" "}
                  <span className="font-semibold text-foreground">
                    {totalMonitors} of {planLimit}
                  </span>{" "}
                  monitors on the free plan.
                </p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link to="/dashboard/settings#plan">Upgrade</Link>
              </Button>
            </div>
          )}
      </div>
    </TooltipProvider>
  );
}
