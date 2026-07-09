import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInfiniteIncidents } from "@/lib/queries/incidents";
import { useMonitors } from "@/lib/queries/monitors";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LoadError } from "@/components/load-error";
import { IncidentStatusBadge } from "@/components/status-badge";
import { SeverityBadge } from "@/components/severity-badge";
import { RelativeTime } from "@/components/relative-time";
import type { Incident } from "@uptimecrow/shared";

type DateInput = string | Date;

// Compact duration from a millisecond span ("12m", "3h 20m", "2d").
function formatDurationMs(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs < 24) return remMins ? `${hrs}h ${remMins}m` : `${hrs}h`;
  const days = Math.floor(hrs / 24);
  const remHrs = hrs % 24;
  return remHrs ? `${days}d ${remHrs}h` : `${days}d`;
}

function spanMs(start: DateInput, end: DateInput): number {
  return Math.max(0, new Date(end).getTime() - new Date(start).getTime());
}

// Down time: resolved → start→resolved; still open → up to now; resolved with
// no timestamp (shouldn't happen, but guard) → unknown, count as 0.
function downMs(inc: Incident): number {
  if (inc.resolvedAt) return spanMs(inc.startedAt, inc.resolvedAt);
  if (inc.status !== "resolved") return spanMs(inc.startedAt, new Date());
  return 0;
}

const severityRank: Record<string, number> = { critical: 3, major: 2, minor: 1 };
const severityDotColor: Record<string, string> = {
  critical: "bg-danger",
  major: "bg-warning",
  minor: "bg-muted-foreground",
};

interface IncidentGroup {
  key: string;
  label: string;
  incidents: Incident[];
  totalDownMs: number;
  hasActive: boolean;
  lastStartedAt: number;
  worstSeverity: Incident["severity"];
}

// Group by monitor so a flapping service reads as one entry ("hooksense · 8×")
// instead of a wall of identical rows. Manual incidents (no monitor) group by
// their title. Active groups float to the top, then most-recent-first.
function groupByMonitor(incidents: Incident[], monitorName: Map<string, string>): IncidentGroup[] {
  const buckets = new Map<string, Incident[]>();
  for (const inc of incidents) {
    const key = inc.monitorId ?? `title:${inc.title}`;
    (buckets.get(key) ?? buckets.set(key, []).get(key)!).push(inc);
  }

  const groups: IncidentGroup[] = [...buckets.entries()].map(([key, incs]) => {
    incs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    const first = incs[0];
    const label = first.monitorId
      ? monitorName.get(first.monitorId) ?? first.title.replace(/\s+is\s+down$/i, "")
      : first.title;
    return {
      key,
      label,
      incidents: incs,
      totalDownMs: incs.reduce((s, i) => s + downMs(i), 0),
      hasActive: incs.some((i) => i.status !== "resolved"),
      lastStartedAt: new Date(first.startedAt).getTime(),
      worstSeverity: incs.reduce<Incident["severity"]>(
        (w, i) => ((severityRank[i.severity] ?? 0) > (severityRank[w] ?? 0) ? i.severity : w),
        "minor",
      ),
    };
  });

  groups.sort(
    (a, b) => Number(b.hasActive) - Number(a.hasActive) || b.lastStartedAt - a.lastStartedAt,
  );
  return groups;
}

function IncidentsListSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="mb-4 h-9 w-56" />
      <div className="divide-y divide-border border-t border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3.5">
            <Skeleton className="h-2 w-2 rounded-full shrink-0" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="ml-auto h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

type Filter = "all" | "active" | "resolved";

// ─── A single incident row (leaf) ─────────────────────────────────────────────
function IncidentRow({ incident, nested }: { incident: Incident; nested?: boolean }) {
  const isActive = incident.status !== "resolved";
  const dotColor = severityDotColor[incident.severity] ?? "bg-muted-foreground";
  const duration = incident.resolvedAt ? formatDurationMs(downMs(incident)) : null;
  return (
    <Link
      to={`/dashboard/incidents/${incident.id}`}
      className={cn(
        "group flex items-center gap-3 py-3 transition-colors hover:bg-muted/40",
        nested ? "pl-9 pr-4" : "px-4",
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {isActive && incident.severity === "critical" && (
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", dotColor)} />
        )}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", dotColor)} />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium transition-colors group-hover:text-brand">
        {incident.title}
      </span>
      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <IncidentStatusBadge status={incident.status} />
        <SeverityBadge severity={incident.severity} />
      </div>
      {duration ? (
        <span className="hidden w-20 shrink-0 items-center justify-end gap-1.5 font-mono text-[11px] tnum text-muted-foreground md:flex">
          <CheckCircle2 className="h-3 w-3 shrink-0 text-success-foreground/70" />
          {duration}
        </span>
      ) : isActive ? (
        <span className="hidden w-20 shrink-0 justify-end font-mono text-[11px] tnum text-warning-foreground md:flex">
          ongoing
        </span>
      ) : (
        <span className="hidden w-20 shrink-0 justify-end font-mono text-[11px] tnum text-muted-foreground/50 md:flex">
          &mdash;
        </span>
      )}
      <span className="w-20 shrink-0 text-right font-mono text-[11px] tnum text-muted-foreground/70">
        <RelativeTime date={incident.startedAt} />
      </span>
    </Link>
  );
}

// ─── A monitor group (expandable when it has >1 incident) ──────────────────────
function GroupRow({ group }: { group: IncidentGroup }) {
  const [open, setOpen] = useState(group.hasActive);
  const single = group.incidents.length === 1;

  if (single) return <IncidentRow incident={group.incidents[0]} />;

  const dotColor = group.hasActive ? "bg-danger" : severityDotColor[group.worstSeverity] ?? "bg-muted-foreground";

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
      >
        <ChevronRight
          className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")}
        />
        <span className="relative flex h-2 w-2 shrink-0">
          {group.hasActive && (
            <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", dotColor)} />
          )}
          <span className={cn("relative inline-flex h-2 w-2 rounded-full", dotColor)} />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{group.label}</span>
        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
            {group.incidents.length}× down
          </span>
          <span className="font-mono text-[11px] tnum text-muted-foreground/70">
            {formatDurationMs(group.totalDownMs)} total
          </span>
          {group.hasActive ? (
            <span className="rounded-full bg-danger/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-danger-foreground">
              active
            </span>
          ) : (
            <SeverityBadge severity={group.worstSeverity} />
          )}
        </div>
        <span className="w-20 shrink-0 text-right font-mono text-[11px] tnum text-muted-foreground/70">
          <RelativeTime date={group.incidents[0].startedAt} />
        </span>
      </button>
      {open && (
        <div className="divide-y divide-border/60 border-t border-border/60 bg-muted/10">
          {group.incidents.map((inc) => (
            <IncidentRow key={inc.id} incident={inc} nested />
          ))}
        </div>
      )}
    </div>
  );
}

export function IncidentsList() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteIncidents();
  const { data: monitors } = useMonitors();
  const [filter, setFilter] = useState<Filter>("all");

  if (isLoading) return <IncidentsListSkeleton />;

  if (isError)
    return (
      <div>
        <PageHeader eyebrow="Incident log" title="Incidents" description="Track and manage service incidents" />
        <LoadError onRetry={() => refetch()} />
      </div>
    );

  const incidents = data?.pages.flatMap((p) => p.incidents) ?? [];
  const activeCount = incidents.filter((i) => i.status !== "resolved").length;

  const filtered = incidents.filter((i) => {
    if (filter === "active") return i.status !== "resolved";
    if (filter === "resolved") return i.status === "resolved";
    return true;
  });

  const monitorName = new Map((monitors ?? []).map((m) => [m.id, m.name]));
  const groups = groupByMonitor(filtered, monitorName);

  return (
    <div>
      <PageHeader
        eyebrow="Incident log"
        title="Incidents"
        description="Track and manage service incidents"
        action={
          <Button asChild>
            <Link to="/dashboard/incidents/new">
              <Plus className="mr-2 h-4 w-4" />
              Report Incident
            </Link>
          </Button>
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active" className="gap-1.5">
            Active
            {activeCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-danger/20 px-1 text-[10px] font-semibold text-danger-foreground">
                {activeCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      {!groups.length ? (
        <EmptyState
          eyebrow="Incident log"
          title="No incidents"
          description={filter === "all" ? "No incidents have been recorded" : `No ${filter} incidents`}
        />
      ) : (
        <>
          <div className="divide-y divide-border border-t border-border">
            {groups.map((g) => (
              <GroupRow key={g.key} group={g} />
            ))}
          </div>
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
