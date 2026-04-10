import { Link } from "react-router-dom";
import { Plus, Activity, Pencil, Trash2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMonitors, useDeleteMonitor } from "@/lib/queries/monitors";
import { useUptime } from "@/lib/queries/analytics";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { RelativeTime } from "@/components/relative-time";
import { ConfirmDialog } from "@/components/confirm-dialog";

function UptimeBar({ percent }: { percent: number | null }) {
  if (percent == null) {
    return <span className="text-xs text-muted-foreground/50">—</span>;
  }
  const pct = Number(percent);
  const barColor =
    pct >= 99.9 ? "bg-emerald-400" : pct >= 99 ? "bg-yellow-400" : "bg-red-400";
  const textColor =
    pct >= 99.9 ? "text-emerald-400" : pct >= 99 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-border">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className={cn("w-14 text-right text-xs tabular-nums font-medium", textColor)}>
        {pct.toFixed(2)}%
      </span>
    </div>
  );
}

function MonitorsListSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="divide-y divide-border border-t border-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3.5">
            <Skeleton className="h-2 w-2 rounded-full shrink-0" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48 hidden md:block" />
            <Skeleton className="h-4 w-28 ml-auto" />
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonitorsList() {
  const { data: monitors, isLoading } = useMonitors();
  const { data: uptimeData } = useUptime(!!(monitors?.length));
  const deleteMutation = useDeleteMonitor();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Monitor deleted"),
      onError: () => toast.error("Failed to delete monitor"),
    });
  };

  if (isLoading) return <MonitorsListSkeleton />;

  const uptimeMap = new Map(uptimeData?.map((u) => [u.monitorId, u]) ?? []);

  return (
    <TooltipProvider>
      <div>
        <PageHeader
          title="Monitors"
          description="Track the uptime of your services"
          action={
            <Button asChild>
              <Link to="/dashboard/monitors/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Monitor
              </Link>
            </Button>
          }
        />

        {!monitors?.length ? (
          <EmptyState
            icon={Activity}
            title="No monitors yet"
            description="Add your first monitor to start tracking uptime"
            action={
              <Button asChild>
                <Link to="/dashboard/monitors/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Monitor
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="border-t border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Response</TableHead>
                  <TableHead>Uptime 30d</TableHead>
                  <TableHead className="hidden sm:table-cell">Last Check</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monitors.map((monitor) => {
                  const uptime = uptimeMap.get(monitor.id);
                  return (
                    <TableRow
                      key={monitor.id}
                      className={cn(
                        monitor.status === "down" && "border-l-2 border-l-red-500",
                        monitor.status === "degraded" && "border-l-2 border-l-yellow-500",
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="relative flex h-2 w-2 shrink-0">
                            {monitor.status === "down" && (
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                            )}
                            <span className={cn("relative inline-flex h-2 w-2 rounded-full", {
                              "bg-emerald-400": monitor.status === "up",
                              "bg-red-400": monitor.status === "down",
                              "bg-yellow-400": monitor.status === "degraded",
                              "bg-zinc-500": monitor.status === "unknown",
                            })} />
                          </span>
                          <Link
                            to={`/dashboard/monitors/${monitor.id}`}
                            className="font-medium text-foreground hover:text-primary transition-colors"
                          >
                            {monitor.name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[180px] truncate text-muted-foreground text-sm">
                        {monitor.url}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-xs font-semibold uppercase tracking-wide",
                          monitor.status === "up" && "text-emerald-400",
                          monitor.status === "down" && "text-red-400",
                          monitor.status === "degraded" && "text-yellow-400",
                          monitor.status === "unknown" && "text-zinc-400",
                        )}>
                          {monitor.status}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm tabular-nums">
                        {monitor.lastResponseMs != null ? `${monitor.lastResponseMs}ms` : "—"}
                      </TableCell>
                      <TableCell>
                        <UptimeBar percent={uptime?.uptimePercent ?? null} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {monitor.lastCheckedAt ? (
                          <RelativeTime date={monitor.lastCheckedAt} />
                        ) : (
                          "Never"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                                <Link to={`/dashboard/monitors/${monitor.id}/edit`} aria-label="Edit monitor">
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          <ConfirmDialog
                            trigger={
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" aria-label="Delete monitor">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                            title="Delete monitor?"
                            description={`This will permanently delete "${monitor.name}" and all its check history.`}
                            onConfirm={() => handleDelete(monitor.id)}
                            destructive
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
