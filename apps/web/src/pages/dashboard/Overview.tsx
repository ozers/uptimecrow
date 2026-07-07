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
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CrowMark } from "@/components/logo";
import { PLAN_LIMITS } from "@uptimecrow/shared";
import type { Plan } from "@uptimecrow/shared";
import { useMonitors } from "@/lib/queries/monitors";
import { useIncidents } from "@/lib/queries/incidents";
import { useStatusPages } from "@/lib/queries/status-pages";
import { useAuthStore } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadError } from "@/components/load-error";
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
      <div className="mb-6 grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
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
    <div className="mb-8 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-xl border border-border bg-card">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <button
            key={i}
            onClick={item.to ? () => navigate(item.to!) : undefined}
            className={cn(
              "px-5 py-4 text-left transition-colors",
              item.to ? "cursor-pointer hover:bg-muted/40" : "cursor-default",
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <Icon className="h-3 w-3 text-muted-foreground/60" />
                {item.label}
              </span>
              {item.badge && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em]",
                    item.badgeColor ?? "bg-brand/10 text-brand",
                  )}
                >
                  {item.badge}
                </span>
              )}
            </div>
            <p
              className={cn(
                "font-display text-[32px] font-bold tnum leading-none tracking-[-0.03em]",
                item.color ?? "text-foreground",
              )}
            >
              {item.value}
            </p>
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
      <CrowMark size={52} className="mx-auto mb-5" />
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        The watch begins
      </p>
      <h1 className="mt-3 font-display text-[30px] font-bold tracking-[-0.03em]">
        Welcome to UptimeCrow
      </h1>
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
            <I className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
            <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Live status banner ───────────────────────────────────────────────────────
// The single source of truth for "is anything down RIGHT NOW" — driven purely by
// monitor reachability, never by incident records. Green = everything responds.

function LiveStatusBanner({
  downMonitors,
  totalMonitors,
  timestamp,
  onRefetch,
  isRefetching,
}: {
  downMonitors: { id: string; name: string }[];
  totalMonitors: number;
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
    seconds < 10 ? "just now" : seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)}m ago`;

  const down = downMonitors.length > 0;

  return (
    <div
      className={cn(
        "mb-3 flex items-center justify-between gap-4 rounded-xl border px-5 py-4 transition-colors",
        down ? "border-danger/30 bg-danger/5" : "border-success/25 bg-success/5",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full",
              down ? "bg-danger opacity-75" : "bg-success opacity-40",
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-2.5 w-2.5 rounded-full",
              down ? "bg-danger" : "bg-success",
            )}
          />
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              "font-display text-[15px] font-bold tracking-[-0.02em]",
              down ? "text-danger-foreground" : "text-success-foreground",
            )}
          >
            {down
              ? `${downMonitors.length} service${downMonitors.length > 1 ? "s" : ""} down right now`
              : "All systems operational"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {down
              ? `Unreachable: ${downMonitors.map((m) => m.name).join(", ")}`
              : `${totalMonitors} service${totalMonitors !== 1 ? "s" : ""} responding normally`}
          </p>
        </div>
      </div>
      <button
        onClick={onRefetch}
        disabled={isRefetching}
        className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] tnum text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 cursor-pointer"
      >
        <RefreshCw className={cn("h-3 w-3", isRefetching && "animate-spin")} />
        {isRefetching ? "Refreshing…" : `Updated ${updatedLabel}`}
      </button>
    </div>
  );
}

// ─── Open-incidents strip ─────────────────────────────────────────────────────
// Incidents are the event log, kept deliberately separate from live status. An
// incident often stays open after the monitor recovers — the #1 source of "is it
// actually down?" confusion — so we name the service, say plainly whether it's
// back up, and give a one-click path to resolve.

function OpenIncidentsStrip({
  incidents,
  monitorStatusById,
}: {
  incidents: { id: string; title: string; monitorId: string | null }[];
  monitorStatusById: Map<string, string>;
}) {
  if (incidents.length === 0) return null;
  const first = incidents[0];
  const backUp = first.monitorId ? monitorStatusById.get(first.monitorId) === "up" : false;

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-warning/30 bg-warning/5 px-5 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning-foreground" />
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-warning-foreground">
            {incidents.length} open incident{incidents.length > 1 ? "s" : ""}
            {backUp && (
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success-foreground">
                service back up
              </span>
            )}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {first.title}
            {incidents.length > 1 ? ` · +${incidents.length - 1} more` : ""}
            {backUp ? " — recovered, ready to resolve." : " — being investigated."}
          </p>
        </div>
      </div>
      <Button size="sm" variant="outline" asChild className="shrink-0">
        <Link to={incidents.length === 1 ? `/dashboard/incidents/${first.id}` : "/dashboard/incidents"}>
          {backUp ? "Resolve" : "Review"}
        </Link>
      </Button>
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

// ─── Status Pill ──────────────────────────────────────────────────────────────
// Plain-language live status so the state is never ambiguous at a glance.

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    up: { label: "Operational", cls: "bg-success/10 text-success-foreground" },
    down: { label: "Down", cls: "bg-danger/15 text-danger-foreground" },
    degraded: { label: "Degraded", cls: "bg-warning/10 text-warning-foreground" },
    unknown: { label: "Pending", cls: "bg-muted text-muted-foreground" },
  };
  const s = map[status] ?? map.unknown;
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em]",
        s.cls,
      )}
    >
      {s.label}
    </span>
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
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {title}
        </p>
        {badge != null && badge > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-danger/20 px-1 font-mono text-[10px] font-bold text-danger-foreground">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.08em]">
        {addTo && (
          <Link
            to={addTo}
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-brand"
          >
            <Plus className="h-3 w-3" />
            Add
          </Link>
        )}
        <Link
          to={to}
          className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
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
    isError: monitorsError,
    dataUpdatedAt,
    refetch: refetchMonitors,
    isRefetching,
  } = useMonitors();
  const {
    data: incidents,
    isLoading: incidentsLoading,
    isError: incidentsError,
    refetch: refetchIncidents,
  } = useIncidents();
  const {
    data: statusPages,
    isLoading: statusPagesLoading,
    isError: statusPagesError,
    refetch: refetchStatusPages,
  } = useStatusPages();

  const totalMonitors = monitors?.length ?? 0;
  const hasMonitors = totalMonitors > 0;

  if (monitorsLoading || incidentsLoading || statusPagesLoading)
    return <OverviewSkeleton />;

  if (monitorsError || incidentsError || statusPagesError)
    return (
      <LoadError
        onRetry={() => {
          refetchMonitors();
          refetchIncidents();
          refetchStatusPages();
        }}
      />
    );

  const totalStatusPages = statusPages?.length ?? 0;

  if (!hasMonitors) {
    return <EmptyOverview />;
  }

  const downMonitors = monitors?.filter((m) => m.status === "down") ?? [];
  const monitorsDown = downMonitors.length;
  const activeIncidents = incidents?.filter((i) => i.status !== "resolved") ?? [];
  const recentIncidents = incidents?.slice(0, 5) ?? [];
  const monitorStatusById = new Map((monitors ?? []).map((m) => [m.id, m.status]));
  const activeIncidentMonitorIds = new Set(
    activeIncidents.map((i) => i.monitorId).filter((id): id is string => !!id),
  );

  const plan = (user?.plan ?? "free") as Plan;
  const planLimit = PLAN_LIMITS[plan].monitors;

  const handleRefetch = () => {
    refetchMonitors();
    refetchIncidents();
  };

  const SHOW_COUNT = 6;
  const visibleMonitors = monitors?.slice(0, SHOW_COUNT) ?? [];
  const hiddenCount = (monitors?.length ?? 0) - SHOW_COUNT;

  const isSettledIn = hasMonitors && totalStatusPages > 0;

  return (
    <TooltipProvider>
      <div>
        {/* Live status — reachability right now (source of truth) */}
        <LiveStatusBanner
          downMonitors={downMonitors}
          totalMonitors={totalMonitors}
          timestamp={dataUpdatedAt}
          onRefetch={handleRefetch}
          isRefetching={isRefetching}
        />

        {/* Open incidents — event log, kept distinct from live status */}
        <OpenIncidentsStrip incidents={activeIncidents} monitorStatusById={monitorStatusById} />

        {/* Alert banners */}
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
              icon: AlertTriangle,
              value: activeIncidents.length,
              label: `open incident${activeIncidents.length !== 1 ? "s" : ""}`,
              color: activeIncidents.length > 0 ? "text-warning-foreground" : undefined,
              to: "/dashboard/incidents",
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
            <div className="rounded-xl border border-border bg-card py-10 text-center">
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
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {visibleMonitors.map((monitor) => {
                const hasIncident = activeIncidentMonitorIds.has(monitor.id);
                return (
                  <Tooltip key={monitor.id}>
                    <TooltipTrigger asChild>
                      <Link
                        to={`/dashboard/monitors/${monitor.id}`}
                        className="group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <StatusDot status={monitor.status} />
                          <span className="truncate text-sm font-medium transition-colors group-hover:text-brand">
                            {monitor.name}
                          </span>
                          {hasIncident && (
                            <span className="flex shrink-0 items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-warning-foreground">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              incident
                            </span>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                          <StatusPill status={monitor.status} />
                          <span className="hidden w-14 text-right font-mono text-[11px] tnum text-muted-foreground md:inline">
                            {monitor.lastResponseMs != null ? `${monitor.lastResponseMs}ms` : "—"}
                          </span>
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
                  className="flex items-center gap-1.5 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
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
            <div className="rounded-xl border border-border bg-card py-10 text-center">
              <ShieldCheck className="mx-auto mb-3 h-7 w-7 text-success-foreground/50" />
              <p className="text-sm font-medium">All quiet</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                No incidents recorded.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {recentIncidents.map((incident) => (
                <Link
                  key={incident.id}
                  to={`/dashboard/incidents/${incident.id}`}
                  className="group flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {incident.status === "resolved" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success-foreground" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-danger-foreground" />
                    )}
                    <span className="truncate text-sm font-medium transition-colors group-hover:text-brand">
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
        {isSettledIn && (
          <div className="mb-8 space-y-3">
            <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Discover
            </p>
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
              <Zap className="h-4 w-4 shrink-0 text-brand" />
              <p className="text-sm text-muted-foreground">
                Using{" "}
                <span className="font-mono font-semibold tnum text-foreground">
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
