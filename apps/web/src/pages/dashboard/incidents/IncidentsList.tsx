import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIncidents } from "@/lib/queries/incidents";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { IncidentStatusBadge } from "@/components/status-badge";
import { SeverityBadge } from "@/components/severity-badge";
import { RelativeTime } from "@/components/relative-time";

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

const statusRowAccent: Record<string, string> = {
  investigating: "border-l-2 border-l-red-500",
  identified: "border-l-2 border-l-yellow-500",
  monitoring: "border-l-2 border-l-yellow-500",
  resolved: "",
};

export function IncidentsList() {
  const { data: incidents, isLoading } = useIncidents();
  const [filter, setFilter] = useState<Filter>("all");

  if (isLoading) return <IncidentsListSkeleton />;

  const activeCount = incidents?.filter((i) => i.status !== "resolved").length ?? 0;

  const filtered = incidents?.filter((i) => {
    if (filter === "active") return i.status !== "resolved";
    if (filter === "resolved") return i.status === "resolved";
    return true;
  });

  const showResolved = filter === "resolved" || filter === "all";

  return (
    <div>
      <PageHeader
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
          icon={AlertTriangle}
          title="No incidents"
          description={filter === "all" ? "No incidents have been recorded" : `No ${filter} incidents`}
        />
      ) : (
        <div className="border-t border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[40%]">Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead className="hidden sm:table-cell">Started</TableHead>
                {showResolved && (
                  <TableHead className="hidden sm:table-cell">Resolved</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((incident) => {
                const isActive = incident.status !== "resolved";
                const dotColor = severityDotColor[incident.severity] ?? "bg-muted-foreground";
                const rowAccent = statusRowAccent[incident.status] ?? "";
                return (
                  <TableRow key={incident.id} className={cn(rowAccent)}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-2 w-2 shrink-0">
                          {isActive && incident.severity === "critical" && (
                            <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", dotColor)} />
                          )}
                          <span className={cn("relative inline-flex h-2 w-2 rounded-full", dotColor)} />
                        </span>
                        <Link
                          to={`/dashboard/incidents/${incident.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {incident.title}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <IncidentStatusBadge status={incident.status} />
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={incident.severity} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 shrink-0" />
                        <RelativeTime date={incident.startedAt} />
                      </div>
                    </TableCell>
                    {showResolved && (
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {incident.resolvedAt ? (
                          <div className="flex items-center gap-1.5 text-success-foreground/80">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            <RelativeTime date={incident.resolvedAt} />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
