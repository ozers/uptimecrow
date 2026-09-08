import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, ExternalLink, ChevronDown } from "lucide-react";
import { useMonitor, useMonitorChecks, useDeleteMonitor } from "@/lib/queries/monitors";
import { Button } from "@/components/ui/button";
import { MonitorStatusBadge } from "@/components/status-badge";
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

  // Uptime computed client-side from the recent check history we already fetch.
  const totalChecks = checks?.length ?? 0;
  const upChecks = checks?.filter((c) => c.status === "up").length ?? 0;
  const uptimePercent =
    totalChecks > 0 ? `${((upChecks / totalChecks) * 100).toFixed(2)}%` : "—";
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
          eyebrow={`${monitor.type} monitor`}
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
            <span className={cn("font-mono text-xl font-bold uppercase leading-none tracking-tight", statusColor)}>
              {monitor.status}
            </span>
          </button>
          <div className="flex items-baseline gap-1.5 text-sm">
            <span className="font-mono tnum text-xl font-bold leading-none tracking-tight">
              {monitor.lastResponseMs != null ? `${monitor.lastResponseMs}ms` : "—"}
            </span>
            <span className="text-xs text-muted-foreground">response</span>
          </div>
          <div className="flex items-baseline gap-1.5 text-sm">
            <span className="font-mono tnum text-xl font-bold leading-none tracking-tight text-brand">
              {uptimePercent}
            </span>
            <span className="text-xs text-muted-foreground">
              uptime{totalChecks > 0 ? ` · last ${totalChecks} checks` : ""}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 text-sm">
            <span className="font-mono tnum text-xl font-bold leading-none tracking-tight">
              {monitor.intervalSeconds}s
            </span>
            <span className="text-xs text-muted-foreground">interval</span>
          </div>
          {monitor.sslExpiresAt != null && monitor.url.startsWith("https://") && (() => {
            const days = Math.floor((new Date(monitor.sslExpiresAt).getTime() - Date.now()) / 86_400_000);
            const expired = days < 0;
            const warning = days < 14;
            return (
              <div className="flex items-baseline gap-1.5 text-sm">
                <span className={cn("font-mono tnum text-xl font-bold leading-none tracking-tight", expired ? "text-danger-foreground" : warning ? "text-warning-foreground" : "")}>
                  {expired ? "Expired" : `${days}d`}
                </span>
                <span className="text-xs text-muted-foreground">SSL expiry</span>
              </div>
            );
          })()}
        </div>

        {/* Response time chart */}
        {checks && checks.length > 0 && (
          <div className="mb-8">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
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
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Recent Failures
              </p>
              {failedChecks.length > 0 && (
                <span className="text-xs text-muted-foreground font-mono tnum">
                  {failedChecks.length} in last {checks.length} checks
                </span>
              )}
            </div>
            {recentFailures.length === 0 ? (
              <div className="border-y border-l-2 border-success/40 bg-success/5 px-4 py-3 text-sm text-success-foreground">
                No failures in the last {checks.length} checks.
              </div>
            ) : (
              <div className="border-t border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Status</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead className="text-right">Failed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentFailures.map((check) => (
                      <TableRow key={check.id}>
                        <TableCell>
                          <MonitorStatusBadge status={check.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm font-mono tnum">
                          {check.statusCode ?? "—"}
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
                            <span className="text-text3">—</span>
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
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Check History
            </p>
            {totalChecks > 0 && (
              <span className="text-xs text-muted-foreground font-mono tnum">
                {visibleChecks.length} of {totalChecks}
              </span>
            )}
          </div>

          {checks && checks.length > 0 ? (
            <>
              <div className="border-t border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
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
                          <MonitorStatusBadge status={check.status} />
                        </TableCell>
                        <TableCell className="font-mono tnum text-muted-foreground text-sm">
                          {check.responseMs != null ? `${check.responseMs}ms` : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm font-mono tnum">
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
                            <span className="text-text3">—</span>
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
            <div className="border-y border-border py-12 text-center">
              <p className="text-sm text-muted-foreground">No checks recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
