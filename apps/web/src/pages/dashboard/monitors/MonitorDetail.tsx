import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, ExternalLink, ChevronDown } from "lucide-react";
import { useMonitor, useMonitorChecks, useDeleteMonitor } from "@/lib/queries/monitors";
import { useUptime } from "@/lib/queries/analytics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageHeader } from "@/components/page-header";
import { AbsoluteTime } from "@/components/relative-time";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ResponseChart } from "@/components/response-chart";

function MonitorDetailSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <div className="mb-8 flex items-center gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
      <div className="mb-2 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="mb-8 h-48 w-full" />
      <div className="mb-2">
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="divide-y divide-border border-t border-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-32 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

const PAGE_SIZE = 25;

export function MonitorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: monitor, isLoading } = useMonitor(id!);
  const { data: checks } = useMonitorChecks(id!);
  const { data: uptimeData } = useUptime(true);
  const deleteMutation = useDeleteMonitor();

  if (isLoading) return <MonitorDetailSkeleton />;
  if (!monitor) return <p className="text-muted-foreground">Monitor not found</p>;

  const handleDelete = () => {
    deleteMutation.mutate(monitor.id, {
      onSuccess: () => {
        toast.success("Monitor deleted");
        navigate("/dashboard/monitors");
      },
    });
  };

  const monitorUptime = uptimeData?.find((u) => u.monitorId === monitor.id);
  const uptimePercent =
    monitorUptime?.uptimePercent != null
      ? `${Number(monitorUptime.uptimePercent).toFixed(2)}%`
      : "—";

  const totalChecks = checks?.length ?? 0;
  const visibleChecks = checks?.slice(0, page * PAGE_SIZE) ?? [];
  const hasMore = totalChecks > page * PAGE_SIZE;
  const failedChecks = checks?.filter((c) => c.status !== "up") ?? [];
  const recentFailures = failedChecks.slice(0, 10);

  const statusColor = {
    up: "text-success-foreground",
    down: "text-danger-foreground",
    degraded: "text-warning-foreground",
    unknown: "text-muted-foreground",
  }[monitor.status] ?? "text-muted-foreground";

  const statusDotColor = {
    up: "bg-success",
    down: "bg-danger",
    degraded: "bg-warning",
    unknown: "bg-muted-foreground",
  }[monitor.status] ?? "bg-muted-foreground";

  return (
    <TooltipProvider>
      <div>
        <PageHeader
          title={monitor.name}
          description={monitor.url}
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={monitor.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/dashboard/monitors/${monitor.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <ConfirmDialog
                trigger={
                  <Button variant="outline" size="sm" className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                }
                title="Delete monitor?"
                description={`This will permanently delete "${monitor.name}" and all its check history.`}
                onConfirm={handleDelete}
                destructive
              />
            </div>
          }
        />

        {/* Inline stats */}
        <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2">
          <button className="flex items-baseline gap-1.5 text-sm">
            <span className="relative flex h-2 w-2 items-center self-center shrink-0">
              {monitor.status === "down" && (
                <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", statusDotColor)} />
              )}
              <span className={cn("relative inline-flex h-2 w-2 rounded-full", statusDotColor)} />
            </span>
            <span className={cn("text-xl font-bold capitalize leading-none tracking-tight", statusColor)}>
              {monitor.status}
            </span>
          </button>
          <div className="flex items-baseline gap-1.5 text-sm">
            <span className="text-xl font-bold tabular-nums leading-none tracking-tight">
              {monitor.lastResponseMs != null ? `${monitor.lastResponseMs}ms` : "—"}
            </span>
            <span className="text-xs text-muted-foreground">response</span>
          </div>
          <div className="flex items-baseline gap-1.5 text-sm">
            <span className="text-xl font-bold tabular-nums leading-none tracking-tight text-primary">
              {uptimePercent}
            </span>
            <span className="text-xs text-muted-foreground">uptime 30d</span>
          </div>
          <div className="flex items-baseline gap-1.5 text-sm">
            <span className="text-xl font-bold tabular-nums leading-none tracking-tight">
              {monitor.intervalSeconds}s
            </span>
            <span className="text-xs text-muted-foreground">interval</span>
          </div>
          {monitorUptime?.p95ResponseMs != null && (
            <div className="flex items-baseline gap-1.5 text-sm">
              <span className="text-xl font-bold tabular-nums leading-none tracking-tight">
                {monitorUptime.p95ResponseMs}ms
              </span>
              <span className="text-xs text-muted-foreground">p95 30d</span>
            </div>
          )}
          {monitorUptime?.p99ResponseMs != null && (
            <div className="flex items-baseline gap-1.5 text-sm">
              <span className="text-xl font-bold tabular-nums leading-none tracking-tight">
                {monitorUptime.p99ResponseMs}ms
              </span>
              <span className="text-xs text-muted-foreground">p99 30d</span>
            </div>
          )}
          {monitor.sslExpiresAt != null && monitor.url.startsWith("https://") && (() => {
            const days = Math.round((new Date(monitor.sslExpiresAt).getTime() - Date.now()) / 86_400_000);
            const expired = days < 0;
            const warning = days < 14;
            return (
              <div className="flex items-baseline gap-1.5 text-sm">
                <span className={cn("text-xl font-bold tabular-nums leading-none tracking-tight", expired ? "text-destructive" : warning ? "text-warning-foreground" : "")}>
                  {expired ? "Expired" : `${days}d`}
                </span>
                <span className="text-xs text-muted-foreground">SSL expiry</span>
              </div>
            );
          })()}
        </div>

        {/* Per-region breakdown (multi-region checks only) */}
        {monitorUptime?.regions && monitorUptime.regions.length > 1 && (
          <div className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              By Region (30d)
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {monitorUptime.regions.map((r) => (
                <div key={r.region} className="rounded-md border border-border bg-card p-3">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{r.region}</div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium tabular-nums">
                      {r.uptimePercent ? `${Number(r.uptimePercent).toFixed(2)}%` : "—"}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {r.avgResponseMs != null ? `${r.avgResponseMs}ms avg` : "—"}
                      {r.p95ResponseMs != null && ` · p95 ${r.p95ResponseMs}ms`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Response time chart */}
        {checks && checks.length > 0 && (
          <div className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Response Time
            </p>
            <ResponseChart checks={checks} />
          </div>
        )}

        {/* Recent failures — surfaces individual failed checks that didn't
            cross the confirmation threshold (so no incident was opened) but
            still pulled uptime % below 100. */}
        {checks && checks.length > 0 && (
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Recent Failures
              </p>
              {failedChecks.length > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {failedChecks.length} in last {checks.length} checks
                </span>
              )}
            </div>
            {recentFailures.length === 0 ? (
              <div className="rounded-md border border-success/20 bg-success/5 px-4 py-3 text-sm text-success-foreground">
                No failures in the last {checks.length} checks.
              </div>
            ) : (
              <div className="border-t border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Status</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead className="text-right">Failed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentFailures.map((check) => (
                      <TableRow key={check.id}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-danger/15 text-danger-foreground border-danger/30"
                          >
                            {check.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm tabular-nums">
                          {check.statusCode ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm uppercase">
                          {check.region || "—"}
                        </TableCell>
                        <TableCell className="max-w-[280px]">
                          {check.errorMessage ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block truncate cursor-default text-sm text-muted-foreground">
                                  {check.errorMessage}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs break-words">
                                {check.errorMessage}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          <AbsoluteTime date={check.checkedAt} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Check history */}
        <div>
          <div className="mb-0 flex items-center justify-between pb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Check History
            </p>
            {totalChecks > 0 && (
              <span className="text-xs text-muted-foreground">
                {visibleChecks.length} of {totalChecks}
              </span>
            )}
          </div>

          {checks && checks.length > 0 ? (
            <>
              <div className="border-t border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Status</TableHead>
                      <TableHead>Response</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead className="text-right">Checked At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleChecks.map((check) => (
                      <TableRow key={check.id}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              check.status === "up"
                                ? "bg-success/15 text-success-foreground border-success/30"
                                : "bg-danger/15 text-danger-foreground border-danger/30"
                            }
                          >
                            {check.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground text-sm">
                          {check.responseMs != null ? `${check.responseMs}ms` : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {check.statusCode ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {check.errorMessage ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block truncate cursor-default text-sm text-muted-foreground">
                                  {check.errorMessage}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs break-words">
                                {check.errorMessage}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          <AbsoluteTime date={check.checkedAt} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Show more ({totalChecks - visibleChecks.length} remaining)
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="border-t border-border py-12 text-center">
              <p className="text-sm text-muted-foreground">No checks recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
