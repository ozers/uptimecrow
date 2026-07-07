import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, ShieldAlert, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMonitors, useDeleteMonitor } from "@/lib/queries/monitors";
import { Button } from "@/components/ui/button";
import { MonitorStatusBadge } from "@/components/status-badge";
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
  const deleteMutation = useDeleteMonitor();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Monitor deleted"),
      onError: () => toast.error("Failed to delete monitor"),
    });
  };

  if (isLoading) return <MonitorsListSkeleton />;

  return (
    <TooltipProvider>
      <div>
        <PageHeader
          eyebrow="The watch"
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
            eyebrow="The watch"
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
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Response</TableHead>
                  <TableHead className="hidden sm:table-cell">Last Check</TableHead>
                  <TableHead className="hidden lg:table-cell">SSL</TableHead>
                  <TableHead className="hidden lg:table-cell">Domain</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monitors.map((monitor) => {
                  return (
                    <TableRow
                      key={monitor.id}
                      className={cn(
                        monitor.status === "down" && "border-l-2 border-l-danger",
                        monitor.status === "degraded" && "border-l-2 border-l-warning",
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="relative flex h-2 w-2 shrink-0">
                            {monitor.status === "down" && (
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
                            )}
                            <span className={cn("relative inline-flex h-2 w-2 rounded-full", {
                              "bg-success": monitor.status === "up",
                              "bg-danger": monitor.status === "down",
                              "bg-warning": monitor.status === "degraded",
                              "bg-muted-foreground": monitor.status === "unknown",
                            })} />
                          </span>
                          <Link
                            to={`/dashboard/monitors/${monitor.id}`}
                            className="font-medium text-foreground hover:text-brand transition-colors"
                          >
                            {monitor.name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[180px] truncate text-muted-foreground text-sm">
                        {monitor.url}
                      </TableCell>
                      <TableCell>
                        <MonitorStatusBadge status={monitor.status} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm font-mono tnum">
                        {monitor.lastResponseMs != null ? `${monitor.lastResponseMs}ms` : "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {monitor.lastCheckedAt ? (
                          <RelativeTime date={monitor.lastCheckedAt} />
                        ) : (
                          "Never"
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {monitor.url.startsWith("https://") && monitor.sslExpiresAt != null ? (() => {
                          const days = Math.round((new Date(monitor.sslExpiresAt).getTime() - Date.now()) / 86_400_000);
                          const expired = days < 0;
                          const warning = days < (monitor.sslDaysWarning ?? 30);
                          return (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={cn(
                                  "inline-flex items-center gap-1 text-xs font-mono tnum",
                                  expired ? "text-danger-foreground" : warning ? "text-warning-foreground" : "text-success-foreground",
                                )}>
                                  <ShieldAlert className="h-3 w-3" />
                                  {expired ? "Expired" : `${days}d`}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {expired ? "SSL certificate has expired" : `SSL certificate expires in ${days} day${days !== 1 ? "s" : ""}`}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })() : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {monitor.domainExpiresAt != null ? (() => {
                          const days = Math.round((new Date(monitor.domainExpiresAt).getTime() - Date.now()) / 86_400_000);
                          const expired = days < 0;
                          const warning = days < (monitor.domainDaysWarning ?? 30);
                          return (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={cn(
                                  "inline-flex items-center gap-1 text-xs font-mono tnum",
                                  expired ? "text-danger-foreground" : warning ? "text-warning-foreground" : "text-success-foreground",
                                )}>
                                  <Globe className="h-3 w-3" />
                                  {expired ? "Expired" : `${days}d`}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {expired ? "Domain has expired" : `Domain expires in ${days} day${days !== 1 ? "s" : ""}`}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })() : (
                          <span className="text-xs text-muted-foreground/40">—</span>
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
