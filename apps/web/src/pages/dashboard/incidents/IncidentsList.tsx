import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInfiniteIncidents } from "@/lib/queries/incidents";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LoadError } from "@/components/load-error";
import { IncidentStatusBadge } from "@/components/status-badge";
import { SeverityBadge } from "@/components/severity-badge";
import { RelativeTime } from "@/components/relative-time";

type DateInput = string | Date;

// Duration between two timestamps, compact ("12m", "3h 20m", "2d").
function formatDuration(start: DateInput, end: DateInput): string {
  const mins = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs < 24) return remMins ? `${hrs}h ${remMins}m` : `${hrs}h`;
  const days = Math.floor(hrs / 24);
  const remHrs = hrs % 24;
  return remHrs ? `${days}d ${remHrs}h` : `${days}d`;
}

// Bucket incidents by how recent they are, so a long list of same-named
// auto-incidents reads as a timeline instead of an undifferentiated wall.
function bucketOf(startedAt: DateInput): string {
  const days = (Date.now() - new Date(startedAt).getTime()) / 86_400_000;
  if (days < 1) return "Today";
  if (days < 7) return "This week";
  if (days < 30) return "This month";
  return "Older";
}
const BUCKET_ORDER = ["Today", "This week", "This month", "Older"];

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
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

type Filter = "all" | "active" | "resolved";

const severityDotColor: Record<string, string> = {
  critical: "bg-danger",
  major: "bg-warning",
  minor: "bg-muted-foreground",
};

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

  const showResolved = filter === "resolved" || filter === "all";

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

      {!filtered?.length ? (
        <EmptyState
          eyebrow="Incident log"
          title="No incidents"
          description={filter === "all" ? "No incidents have been recorded" : `No ${filter} incidents`}
        />
      ) : (
        <div className="space-y-6">
          {BUCKET_ORDER.map((bucket) => {
            const rows = filtered.filter((i) => bucketOf(i.startedAt) === bucket);
            if (rows.length === 0) return null;
            return (
              <section key={bucket}>
                <div className="mb-2 flex items-baseline gap-2 px-1">
                  <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {bucket}
                  </h2>
                  <span className="font-mono text-[11px] tnum text-muted-foreground/50">
                    {rows.length}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                  {rows.map((incident) => {
                    const isActive = incident.status !== "resolved";
                    const dotColor = severityDotColor[incident.severity] ?? "bg-muted-foreground";
                    const duration =
                      incident.resolvedAt != null
                        ? formatDuration(incident.startedAt, incident.resolvedAt)
                        : null;
                    return (
                      <Link
                        key={incident.id}
                        to={`/dashboard/incidents/${incident.id}`}
                        className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40"
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
                        {/* Duration is the key differentiator between otherwise-identical
                            auto-incidents — how long the service was actually affected. */}
                        {duration ? (
                          <span className="hidden w-24 shrink-0 items-center justify-end gap-1.5 font-mono text-[11px] tnum text-muted-foreground md:flex">
                            <CheckCircle2 className="h-3 w-3 shrink-0 text-success-foreground/70" />
                            {duration}
                          </span>
                        ) : (
                          <span className="hidden w-24 shrink-0 justify-end font-mono text-[11px] tnum text-warning-foreground md:flex">
                            ongoing
                          </span>
                        )}
                        <span className="w-20 shrink-0 text-right font-mono text-[11px] tnum text-muted-foreground/70">
                          <RelativeTime date={incident.startedAt} />
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
          {hasNextPage && (
            <div className="flex justify-center pt-1">
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
        </div>
      )}
    </div>
  );
}
