import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, AlertTriangle, Bot } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LoadingPage } from "@/components/loading-page";
import { IncidentStatusBadge } from "@/components/status-badge";
import { SeverityBadge } from "@/components/severity-badge";
import { RelativeTime } from "@/components/relative-time";

type Filter = "all" | "active" | "resolved";

export function IncidentsList() {
  const { data: incidents, isLoading } = useIncidents();
  const [filter, setFilter] = useState<Filter>("all");

  if (isLoading) return <LoadingPage />;

  const filtered = incidents?.filter((i) => {
    if (filter === "active") return i.status !== "resolved";
    if (filter === "resolved") return i.status === "resolved";
    return true;
  });

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
          <TabsTrigger value="active">Active</TabsTrigger>
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
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Resolved</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>
                    <Link
                      to={`/dashboard/incidents/${incident.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {incident.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <IncidentStatusBadge status={incident.status} />
                  </TableCell>
                  <TableCell>
                    <SeverityBadge severity={incident.severity} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <RelativeTime date={incident.startedAt} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {incident.resolvedAt ? <RelativeTime date={incident.resolvedAt} /> : "—"}
                  </TableCell>
                  <TableCell>
                    {incident.isAiGenerated ? (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Bot className="h-3 w-3" />
                        AI
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Manual</span>
                    )}
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
