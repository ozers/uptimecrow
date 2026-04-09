import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import { useMonitor, useMonitorChecks, useDeleteMonitor } from "@/lib/queries/monitors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { LoadingPage } from "@/components/loading-page";
import { MonitorStatusBadge } from "@/components/status-badge";
import { RelativeTime, AbsoluteTime } from "@/components/relative-time";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ResponseChart } from "@/components/response-chart";

export function MonitorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: monitor, isLoading } = useMonitor(id!);
  const { data: checks } = useMonitorChecks(id!);
  const deleteMutation = useDeleteMonitor();

  if (isLoading) return <LoadingPage />;
  if (!monitor) return <p className="text-muted-foreground">Monitor not found</p>;

  const handleDelete = () => {
    deleteMutation.mutate(monitor.id, {
      onSuccess: () => {
        toast.success("Monitor deleted");
        navigate("/dashboard/monitors");
      },
    });
  };

  return (
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

      <div className="mb-6 grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <MonitorStatusBadge status={monitor.status} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {monitor.lastResponseMs != null ? `${monitor.lastResponseMs}ms` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Interval</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{monitor.intervalSeconds}s</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-xs uppercase">
              {monitor.type}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {checks && checks.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponseChart checks={checks} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Check History</CardTitle>
        </CardHeader>
        <CardContent>
          {checks && checks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Status Code</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Checked At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks.map((check) => (
                  <TableRow key={check.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          check.status === "up"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-red-500/15 text-red-400 border-red-500/30"
                        }
                      >
                        {check.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{check.responseMs != null ? `${check.responseMs}ms` : "—"}</TableCell>
                    <TableCell>{check.statusCode ?? "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {check.errorMessage ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <AbsoluteTime date={check.checkedAt} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No checks recorded yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
