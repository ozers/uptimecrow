import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Circle,
  ArrowRight,
  Rocket,
  Globe,
} from "lucide-react";
import { useMonitors } from "@/lib/queries/monitors";
import { useIncidents } from "@/lib/queries/incidents";
import { useStatusPages } from "@/lib/queries/status-pages";
import { useUptime } from "@/lib/queries/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { LoadingPage } from "@/components/loading-page";
import { IncidentStatusBadge } from "@/components/status-badge";
import { SeverityBadge } from "@/components/severity-badge";
import { RelativeTime } from "@/components/relative-time";

function Onboarding({ hasMonitors, hasStatusPages }: { hasMonitors: boolean; hasStatusPages: boolean }) {
  const steps = [
    {
      done: hasMonitors,
      title: "Add your first monitor",
      description: "Start tracking the uptime of a website or API endpoint.",
      href: "/dashboard/monitors/new",
      icon: Activity,
    },
    {
      done: hasStatusPages,
      title: "Create a status page",
      description: "Give your users a public page to check service status.",
      href: "/dashboard/status-pages/new",
      icon: Globe,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  return (
    <div>
      <PageHeader title="Welcome to UptimeCrow" />
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Rocket className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Get started</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Complete these steps to set up your monitoring.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-secondary">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(completedCount / steps.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {completedCount}/{steps.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.map((step) => (
            <Link
              key={step.title}
              to={step.done ? "#" : step.href}
              className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
                step.done
                  ? "border-primary/20 bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-accent"
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${step.done ? "text-muted-foreground line-through" : ""}`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {!step.done && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
            </Link>
          ))}

          {allDone && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-primary" />
              <p className="text-sm font-medium">You're all set!</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your monitors are running. Check back soon to see uptime data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function Overview() {
  const { data: monitors, isLoading: monitorsLoading } = useMonitors();
  const { data: incidents, isLoading: incidentsLoading } = useIncidents();
  const { data: statusPages, isLoading: statusPagesLoading } = useStatusPages();

  const totalMonitors = monitors?.length ?? 0;
  const totalStatusPages = statusPages?.length ?? 0;
  const hasMonitors = totalMonitors > 0;
  const hasStatusPages = totalStatusPages > 0;

  const { data: uptimeData } = useUptime(hasMonitors);

  if (monitorsLoading || incidentsLoading || statusPagesLoading) return <LoadingPage />;

  if (!hasMonitors || !hasStatusPages) {
    return <Onboarding hasMonitors={hasMonitors} hasStatusPages={hasStatusPages} />;
  }

  const monitorsUp = monitors?.filter((m) => m.status === "up").length ?? 0;
  const monitorsDown = monitors?.filter((m) => m.status === "down").length ?? 0;

  const validUptime = uptimeData?.filter((u) => u.uptimePercent != null) ?? [];
  const avgUptime =
    validUptime.length > 0
      ? (validUptime.reduce((sum, u) => sum + Number(u.uptimePercent), 0) / validUptime.length).toFixed(2)
      : "—";

  const activeIncidents = incidents?.filter((i) => i.status !== "resolved") ?? [];
  const recentIncidents = incidents?.slice(0, 5) ?? [];

  return (
    <div>
      <PageHeader title="Dashboard" />

      <div className="mb-6 grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Monitors
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalMonitors}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Up</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-400">{monitorsUp}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Down</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">{monitorsDown}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Uptime (30d)
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgUptime}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Monitors</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/monitors">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monitors?.slice(0, 6).map((monitor) => (
                <Link
                  key={monitor.id}
                  to={`/dashboard/monitors/${monitor.id}`}
                  className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        monitor.status === "up"
                          ? "bg-emerald-400"
                          : monitor.status === "down"
                            ? "bg-red-400"
                            : "bg-yellow-400"
                      }`}
                    />
                    <span className="text-sm font-medium">{monitor.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {monitor.lastResponseMs != null ? `${monitor.lastResponseMs}ms` : "—"}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Recent Incidents
              {activeIncidents.length > 0 && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500/15 text-xs text-red-400">
                  {activeIncidents.length}
                </span>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/incidents">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentIncidents.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No incidents recorded
              </p>
            ) : (
              <div className="space-y-3">
                {recentIncidents.map((incident) => (
                  <Link
                    key={incident.id}
                    to={`/dashboard/incidents/${incident.id}`}
                    className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle
                        className={`h-4 w-4 ${
                          incident.status === "resolved" ? "text-emerald-400" : "text-red-400"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium">{incident.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <IncidentStatusBadge status={incident.status} />
                          <SeverityBadge severity={incident.severity} />
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      <RelativeTime date={incident.startedAt} />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
