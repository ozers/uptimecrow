import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createIncidentSchema, INCIDENT_STATUSES, INCIDENT_SEVERITIES } from "@uptimecrow/shared";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const incidentResolver = zodResolver(createIncidentSchema) as any;
import { toast } from "sonner";
import { useCreateIncident } from "@/lib/queries/incidents";
import { useStatusPages } from "@/lib/queries/status-pages";
import { useMonitors } from "@/lib/queries/monitors";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type IncidentForm = {
  statusPageId: string;
  monitorId?: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "minor" | "major" | "critical";
  body: string;
};

const INCIDENT_TEMPLATES: Array<{
  label: string;
  category: string;
  title: string;
  status: IncidentForm["status"];
  severity: IncidentForm["severity"];
  body: string;
}> = [
  {
    category: "Investigating",
    label: "Elevated error rates",
    title: "Elevated error rates on API",
    status: "investigating",
    severity: "major",
    body: "We are investigating reports of elevated error rates affecting the API. Engineers have been paged and are actively investigating the cause. We will provide updates as we learn more.",
  },
  {
    category: "Investigating",
    label: "Service degradation",
    title: "Service experiencing degraded performance",
    status: "investigating",
    severity: "minor",
    body: "We are currently investigating degraded performance affecting some users. Response times may be slower than usual. We apologize for the inconvenience and are working to resolve this quickly.",
  },
  {
    category: "Investigating",
    label: "Complete outage",
    title: "Service outage — all systems affected",
    status: "investigating",
    severity: "critical",
    body: "We are experiencing a complete service outage. Our team has been notified and is actively working on a resolution. We will update this page every 15 minutes until the issue is resolved.",
  },
  {
    category: "Identified",
    label: "Root cause identified",
    title: "Root cause identified — fix in progress",
    status: "identified",
    severity: "major",
    body: "We have identified the root cause of this incident. Our engineering team is actively deploying a fix. We expect services to return to normal within the next 30 minutes.",
  },
  {
    category: "Identified",
    label: "Database issue",
    title: "Database connection issues identified",
    status: "identified",
    severity: "major",
    body: "The root cause has been identified as a database connection pool exhaustion. We are scaling up database connections and applying configuration changes. Services will recover as the fix is rolled out.",
  },
  {
    category: "Monitoring",
    label: "Fix deployed, monitoring",
    title: "Fix deployed — monitoring recovery",
    status: "monitoring",
    severity: "minor",
    body: "A fix has been deployed and we are monitoring the systems to confirm full recovery. Services should be returning to normal. We will close this incident once we confirm stability.",
  },
  {
    category: "Infrastructure",
    label: "Deployment issue",
    title: "Deployment causing service disruption",
    status: "investigating",
    severity: "major",
    body: "A recent deployment appears to be causing service disruption. We are rolling back to the previous version as a precaution while we investigate.",
  },
  {
    category: "Infrastructure",
    label: "Third-party provider issue",
    title: "Third-party provider experiencing issues",
    status: "investigating",
    severity: "minor",
    body: "We are aware of degraded performance affecting some features. This appears to be related to issues with a third-party provider. We are monitoring their status and have opened a support ticket.",
  },
  {
    category: "Maintenance",
    label: "Emergency maintenance",
    title: "Emergency maintenance in progress",
    status: "investigating",
    severity: "minor",
    body: "We are performing emergency maintenance to address a critical security or stability issue. Expected completion within 2 hours. We apologize for the short notice.",
  },
];

export function IncidentCreate() {
  const navigate = useNavigate();
  const mutation = useCreateIncident();
  const { data: statusPages } = useStatusPages();
  const { data: monitors } = useMonitors();
  const [templateOpen, setTemplateOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IncidentForm>({
    resolver: incidentResolver,
    defaultValues: {
      status: "investigating",
      severity: "minor",
    },
  });

  const applyTemplate = (tpl: typeof INCIDENT_TEMPLATES[0]) => {
    setValue("title", tpl.title);
    setValue("status", tpl.status);
    setValue("severity", tpl.severity);
    setValue("body", tpl.body);
    setTemplateOpen(false);
  };

  const onSubmit = (data: IncidentForm) => {
    mutation.mutate(data, {
      onSuccess: (res) => {
        toast.success("Incident reported");
        navigate(`/dashboard/incidents/${res.incident.id}`);
      },
      onError: (e) =>
        toast.error(e instanceof ApiError ? e.message : "Failed to create incident"),
    });
  };

  const categories = [...new Set(INCIDENT_TEMPLATES.map((t) => t.category))];

  return (
    <div>
      <PageHeader eyebrow="New incident" title="Report Incident" description="Create a new incident report" />
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6">

        {/* Template picker */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Template
              </p>
              <p className="mt-1.5 text-sm font-medium text-foreground">Quick start from a template</p>
              <p className="text-xs text-muted-foreground mt-0.5">Pre-fill title and update body for common incident types</p>
            </div>
            <DropdownMenu open={templateOpen} onOpenChange={setTemplateOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                  Use Template
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {categories.map((cat) => (
                  <div key={cat}>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">{cat}</DropdownMenuLabel>
                    {INCIDENT_TEMPLATES.filter((t) => t.category === cat).map((tpl) => (
                      <DropdownMenuItem key={tpl.label} onClick={() => applyTemplate(tpl)} className="cursor-pointer">
                        <span>{tpl.label}</span>
                        <span className="ml-auto text-xs text-muted-foreground capitalize">{tpl.severity}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-6 pt-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Details
            </p>

            <div className="space-y-2">
              <Label>Status Page</Label>
              <Select onValueChange={(v) => setValue("statusPageId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status page" />
                </SelectTrigger>
                <SelectContent>
                  {statusPages?.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      {sp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.statusPageId && (
                <p className="text-sm text-danger-foreground">{errors.statusPageId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Service outage on API" {...register("title")} />
              {errors.title && <p className="text-sm text-danger-foreground">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Monitor (optional)</Label>
              <Select onValueChange={(v) => setValue("monitorId", v === "none" ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select monitor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {monitors?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(v) => setValue("status", v as IncidentForm["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCIDENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={watch("severity")}
                  onValueChange={(v) => setValue("severity", v as IncidentForm["severity"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCIDENT_SEVERITIES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Initial Update</Label>
              <Textarea
                id="body"
                placeholder="Describe what's happening..."
                rows={4}
                {...register("body")}
              />
              {errors.body && <p className="text-sm text-danger-foreground">{errors.body.message}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Reporting..." : "Report Incident"}
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link to="/dashboard/incidents">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
