import { Link } from "react-router-dom";
import { Plus, Activity } from "lucide-react";
import { toast } from "sonner";
import { useMonitors, useDeleteMonitor } from "@/lib/queries/monitors";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LoadingPage } from "@/components/loading-page";
import { MonitorStatusBadge } from "@/components/status-badge";
import { RelativeTime } from "@/components/relative-time";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function MonitorsList() {
  const { data: monitors, isLoading } = useMonitors();
  const deleteMutation = useDeleteMonitor();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Monitor deleted"),
      onError: () => toast.error("Failed to delete monitor"),
    });
  };

  if (isLoading) return <LoadingPage />;

  return (
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
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Last Check</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monitors.map((monitor) => (
                <TableRow key={monitor.id}>
                  <TableCell>
                    <Link
                      to={`/dashboard/monitors/${monitor.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {monitor.name}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {monitor.url}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs uppercase">
                      {monitor.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <MonitorStatusBadge status={monitor.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {monitor.lastResponseMs != null ? `${monitor.lastResponseMs}ms` : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {monitor.intervalSeconds}s
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {monitor.lastCheckedAt ? (
                      <RelativeTime date={monitor.lastCheckedAt} />
                    ) : (
                      "Never"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/dashboard/monitors/${monitor.id}/edit`}>Edit</Link>
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="sm" className="text-destructive">
                            Delete
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
