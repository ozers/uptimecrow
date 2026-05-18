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
  TrendingUp,
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
      <Skeleton className="mb-6 h-[80px] w-full rounded-xl" />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-xl" />
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
    </div>
  );
}

// ─── Metric Cards ─────────────────────────────────────────────────────────────

function MetricCards({
  items,
}: {
  items: {
    label: string;
    value: string | number;
    color?: string;
    to?: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
  }[];
}) {
  const navigate = useNavigate();
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <button
            key={i}
            onClick={item.to ? () => navigate(item.to!) : undefined}
            className={cn(
              "rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-all",
              item.to
                ? "cursor-pointer hover:border-primary/20 hover:bg-muted/40"
                : "cursor-default",
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
              {item.badge && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    item.badgeColor ?? "bg-primary/10 text-primary",
                  )}
                >
                  {item.badge}
                </span>
              )}
            </div>
            <p
              className={cn(
                "text-2xl font-bold tabular-nums leading-none tracking-tight",
                item.color ?? "text-foreground",
              )}
            >
              {item.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
          </button>
        );
      })}
    </div>
  );
}

// ─── Empty Overview ──────────────────────────────────────────────────────────
// Shown when the org has no monitors yet. The persistent SetupChecklist banner
// in DashboardLayout handles step-by-step guidance — this is just a friendly
// hero pointing to the first action.

function EmptyOverview() {
  return (
    <div className="mx-auto max-w-2xl py-12 text-center">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
        <Activity className="h-5 w-5 text-primary" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Welcome to UptimeCrow</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Use the setup guide above to get going. Start by adding a monitor — paste
        any HTTP URL, and we&apos;ll watch it around the clock.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button asChild>
          <Link to="/dashboard/monitors/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Add your first monitor
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/dashboard/status-pages/new">
            <Globe className="mr-1.5 h-4 w-4" />
            Create status page
          </Link>
        </Button>
      </div>
      <div className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
        {[
          { icon: ShieldCheck, text: "Auto incident creation when services go down" },
          { icon: Globe, text: "A live public status page for your users" },
          { icon: Zap, text: "Instant Slack & email alerts to your team" },
        ].map(({ icon: I, text }) => (
          <div
            key={text}
            className="flex items-start gap-2.5 rounded-lg border border-dashed border-border px-3 py-3"
          >
            <I className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
            <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
          </div>
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
  let headlineColor = "text-success-foreground";
  let sub = "Everything is running smoothly.";

  if (!hasMonitors) {
    headline = "No monitors yet";
    headlineColor = "";
    sub = "Add a monitor below to start tracking uptime.";
  } else if (monitorsDown > 0) {
    bg = "bg-danger/5";
    border = "border-danger/25";
    headlineColor = "text-danger-foreground";
    headline = `${monitorsDown} monitor${monitorsDown > 1 ? "s" : ""} down`;
    sub = "One or more services are unreachable right now.";
    dot = (
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-danger" />
      </span>
    );
  } else if (activeIncidents > 0) {
    bg = "bg-warning/5";
    border = "border-warning/25";
    headlineColor = "text-warning-foreground";
    headline = `${activeIncidents} active incident${activeIncidents > 1 ? "s" : ""}`;
    sub = "An incident is being investigated.";
    dot = <AlertTriangle className="h-4 w-4 shrink-0 text-warning-foreground" />;
  } else if (hasMonitors) {
    dot = (
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-40" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
      </span>
    );
  }

  return (
    <div
      className={cn(
        "mb-6 flex items-center justify-between gap-4 rounded-xl border px-5 py-4 transition-colors",
        bg,
        border,
      )}
    >
      <div className="flex items-center gap-3">
        {dot}
        <div>
          <p className={cn("text-sm font-bold tracking-tight", headlineColor)}>
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

// ─── Status Dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    up: "bg-success",
    down: "bg-danger",
    degraded: "bg-warning",
    unknown: "bg-muted-foreground",
  };
  const color = colorMap[status] ?? "bg-muted-foreground";
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
      ? "bg-success"
      : ms < 800
        ? "bg-warning"
        : "bg-danger";
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
  addTo,
}: {
  title: string;
  badge?: number;
  to: string;
  addTo?: string;
}) {
  return (
    <div className="mb-0 flex items-center justify-between pb-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
        {badge != null && badge > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-danger/20 px-1 text-[10px] font-bold text-danger-foreground">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {addTo && (
          <Link
            to={addTo}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            <Plus className="h-3 w-3" />
            Add
          </Link>
        )}
        <Link
          to={to}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
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
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <Button size="sm" variant="outline" asChild className="shrink-0">
        <Link to={to}>{cta}</Link>
      </Button>
    </div>
  );
}

// ─── Nudge Banner ─────────────────────────────────────────────────────────────

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

  if (!hasMonitors) {
    return <EmptyOverview />;
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

        {/* Alert banners */}
        {lateHeartbeats.length > 0 && (
          <NudgeBanner
            icon={Heart}
            text={
              <>
                <span className="font-semibold text-danger-foreground">
                  {lateHeartbeats.length} heartbeat
                  {lateHeartbeats.length > 1 ? "s" : ""} late
                </span>{" "}
                — a scheduled task hasn&apos;t pinged in time.
              </>
            }
            cta="View heartbeats"
            to="/dashboard/heartbeats"
          />
        )}

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

        {/* Metric cards */}
        <MetricCards
          items={[
            {
              icon: Activity,
              value: totalMonitors,
              label: `monitor${totalMonitors !== 1 ? "s" : ""}`,
              to: "/dashboard/monitors",
              badge: monitorsDown > 0 ? `${monitorsDown} down` : undefined,
              badgeColor: monitorsDown > 0 ? "bg-danger/15 text-danger-foreground" : undefined,
            },
            {
              icon: TrendingUp,
              value: avgUptime,
              label: "avg uptime",
              color: "text-primary",
            },
            {
              icon: AlertTriangle,
              value: activeIncidents.length,
              label: `active incident${activeIncidents.length !== 1 ? "s" : ""}`,
              color: activeIncidents.length > 0 ? "text-warning-foreground" : undefined,
              to: "/dashboard/incidents",
              badge: activeIncidents.length > 0 ? "live" : undefined,
              badgeColor: "bg-warning/10 text-warning-foreground",
            },
            {
              icon: Globe,
              value: totalStatusPages,
              label: `status page${totalStatusPages !== 1 ? "s" : ""}`,
              to: "/dashboard/status-pages",
            },
          ]}
        />

        {/* Monitors section */}
        <div className="mb-8">
          <SectionHeader
            title="Monitor Status"
            to="/dashboard/monitors"
            addTo="/dashboard/monitors/new"
          />
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
                      ? "text-success-foreground"
                      : uptimePct >= 99
                        ? "text-warning-foreground"
                        : "text-danger-foreground";
                return (
                  <Tooltip key={monitor.id}>
                    <TooltipTrigger asChild>
                      <Link
                        to={`/dashboard/monitors/${monitor.id}`}
                        className="group flex items-center justify-between py-3 transition-colors hover:text-primary"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <StatusDot status={monitor.status} />
                          <span className="truncate text-sm font-medium">
                            {monitor.name}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-5">
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
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
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
            addTo="/dashboard/incidents/new"
          />
          {recentIncidents.length === 0 ? (
            <div className="border-t border-b border-border py-10 text-center">
              <ShieldCheck className="mx-auto mb-3 h-7 w-7 text-success-foreground/50" />
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
                  <div className="flex min-w-0 items-center gap-3">
                    {incident.status === "resolved" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success-foreground" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-danger-foreground" />
                    )}
                    <span className="truncate text-sm font-medium">
                      {incident.title}
                    </span>
                    <div className="hidden items-center gap-1.5 sm:flex shrink-0">
                      <IncidentStatusBadge status={incident.status} />
                      <SeverityBadge severity={incident.severity} />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      <RelativeTime date={incident.startedAt} />
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Feature discovery */}
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
              desc="Schedule planned downtime to pause alerts and notify subscribers in advance."
              cta="Schedule a window"
              to="/dashboard/maintenance"
            />
          </div>
        )}

        {/* Upgrade nudge */}
        {plan === "free" && totalMonitors >= Math.floor(planLimit * 0.66) && (
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
