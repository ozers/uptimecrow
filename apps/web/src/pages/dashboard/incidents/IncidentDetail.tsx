import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createIncidentUpdateSchema, INCIDENT_STATUSES } from "@uptimecrow/shared";
import { toast } from "sonner";
import { Send, CheckCircle2 } from "lucide-react";
import { useIncident, useCreateIncidentUpdate, useUpdateIncident } from "@/lib/queries/incidents";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { IncidentStatusBadge } from "@/components/status-badge";
import { SeverityBadge } from "@/components/severity-badge";
import { RelativeTime } from "@/components/relative-time";
import type { z } from "zod";

type UpdateForm = z.infer<typeof createIncidentUpdateSchema>;

const updateDotColor: Record<string, string> = {
  investigating: "bg-danger",
  identified: "bg-warning",
  monitoring: "bg-info",
  resolved: "bg-success",
};

function IncidentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useIncident(id!);
  const createUpdate = useCreateIncidentUpdate(id!);
  const updateIncident = useUpdateIncident(id!);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateForm>({
    resolver: zodResolver(createIncidentUpdateSchema),
    defaultValues: { status: "investigating" },
  });

  if (isLoading) return <IncidentDetailSkeleton />;
  if (!data) return <p className="text-muted-foreground">Incident not found</p>;

  const { incident, updates } = data;
  const isActive = incident.status !== "resolved";

  const onSubmitUpdate = (formData: UpdateForm) => {
    createUpdate.mutate(formData, {
      onSuccess: () => {
        toast.success("Update posted");
        reset();
      },
      onError: (e) =>
        toast.error(e instanceof ApiError ? e.message : "Failed to post update"),
    });
  };

  return (
    <div>
      <PageHeader
        eyebrow={`Incident · ${incident.status}`}
        title={incident.title}
        action={
          isActive && (
            <Button
              className="bg-success text-success-foreground shadow-sm hover:-translate-y-px hover:shadow-md hover:brightness-105"
              onClick={() =>
                updateIncident.mutate(
                  { status: "resolved" },
                  { onSuccess: () => toast.success("Incident resolved") },
                )
              }
              disabled={updateIncident.isPending}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {updateIncident.isPending ? "Resolving..." : "Resolve Incident"}
            </Button>
          )
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <IncidentStatusBadge status={incident.status} />
        <SeverityBadge severity={incident.severity} />
        <span className="text-sm text-muted-foreground">
          Started{" "}
          <span className="font-mono tnum">
            <RelativeTime date={incident.startedAt} />
          </span>
        </span>
        {incident.resolvedAt && (
          <span className="text-sm text-muted-foreground">
            Resolved{" "}
            <span className="font-mono tnum">
              <RelativeTime date={incident.resolvedAt} />
            </span>
          </span>
        )}
      </div>

      <div className="space-y-6">
        <div className="space-y-6">
          <section className="border-t border-border pt-5">
            <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Timeline
            </p>
            <div>
              {updates && updates.length > 0 ? (
                <div className="divide-y divide-border">
                  {updates.map((update, i) => (
                    <div key={update.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                            updateDotColor[update.status] ?? "bg-muted-foreground",
                          )}
                        />
                        {i < updates.length - 1 && (
                          <div className="mt-1 w-px flex-1 bg-border" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <IncidentStatusBadge status={update.status} />
                          <span className="font-mono tnum text-xs text-muted-foreground">
                            <RelativeTime date={update.createdAt} />
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">{update.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No updates yet</p>
              )}
            </div>
          </section>
        </div>

        {isActive && (
          <div className="max-w-xl">
            <section className="border-t border-border pt-5">
              <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Post Update
              </p>
              <div>
                <form onSubmit={handleSubmit(onSubmitUpdate)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={watch("status")}
                      onValueChange={(v) => setValue("status", v as UpdateForm["status"])}
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
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Describe the current state..."
                      rows={4}
                      {...register("body")}
                    />
                    {errors.body && (
                      <p className="text-sm text-danger-foreground">{errors.body.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={createUpdate.isPending}>
                    <Send className="mr-2 h-4 w-4" />
                    {createUpdate.isPending ? "Posting..." : "Post Update"}
                  </Button>
                </form>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
