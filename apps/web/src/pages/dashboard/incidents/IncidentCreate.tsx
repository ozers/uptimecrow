import { useNavigate } from "react-router-dom";
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
import { PageHeader } from "@/components/page-header";
type IncidentForm = {
  statusPageId: string;
  monitorId?: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "minor" | "major" | "critical";
  body: string;
};

export function IncidentCreate() {
  const navigate = useNavigate();
  const mutation = useCreateIncident();
  const { data: statusPages } = useStatusPages();
  const { data: monitors } = useMonitors();

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

  return (
    <div>
      <PageHeader title="Report Incident" description="Create a new incident report" />
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" placeholder="Service outage on API" {...register("title")} />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>

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
            <p className="text-sm text-destructive">{errors.statusPageId.message}</p>
          )}
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

        <div className="grid grid-cols-2 gap-4">
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
          {errors.body && <p className="text-sm text-destructive">{errors.body.message}</p>}
        </div>

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Reporting..." : "Report Incident"}
        </Button>
      </form>
    </div>
  );
}
