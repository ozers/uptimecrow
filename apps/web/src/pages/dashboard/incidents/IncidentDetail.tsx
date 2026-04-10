import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createIncidentUpdateSchema, INCIDENT_STATUSES } from "@uptimecrow/shared";
import { toast } from "sonner";
import { Bot, Send, CheckCircle2 } from "lucide-react";
import { useIncident, useCreateIncidentUpdate, useUpdateIncident } from "@/lib/queries/incidents";
import { ApiError } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { IncidentStatusBadge } from "@/components/status-badge";
import { SeverityBadge } from "@/components/severity-badge";
import { RelativeTime } from "@/components/relative-time";
import type { z } from "zod";

type UpdateForm = z.infer<typeof createIncidentUpdateSchema>;

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
        title={incident.title}
        action={
          isActive && (
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
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
        {incident.isAiGenerated && (
          <Badge variant="outline" className="gap-1 text-xs">
            <Bot className="h-3 w-3" />
            AI Generated
          </Badge>
        )}
        <span className="text-sm text-muted-foreground">
          Started <RelativeTime date={incident.startedAt} />
        </span>
        {incident.resolvedAt && (
          <span className="text-sm text-muted-foreground">
            Resolved <RelativeTime date={incident.resolvedAt} />
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {updates && updates.length > 0 ? (
                <div className="space-y-0">
                  {updates.map((update, i) => (
                    <div key={update.id}>
                      <div className="flex gap-4 py-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`h-3 w-3 rounded-full ${
                              update.status === "resolved"
                                ? "bg-emerald-400"
                                : update.status === "investigating"
                                  ? "bg-red-400"
                                  : "bg-yellow-400"
                            }`}
                          />
                          {i < updates.length - 1 && (
                            <div className="mt-1 w-px flex-1 bg-border" />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="mb-1 flex items-center gap-2">
                            <IncidentStatusBadge status={update.status} />
                            {update.isAiGenerated && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <Bot className="h-3 w-3" />
                                AI
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              <RelativeTime date={update.createdAt} />
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80">{update.body}</p>
                        </div>
                      </div>
                      {i < updates.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No updates yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {isActive && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Post Update</CardTitle>
              </CardHeader>
              <CardContent>
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
                      <p className="text-sm text-destructive">{errors.body.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={createUpdate.isPending}>
                    <Send className="mr-2 h-4 w-4" />
                    {createUpdate.isPending ? "Posting..." : "Post Update"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
