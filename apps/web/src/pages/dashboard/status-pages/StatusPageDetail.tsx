import { Link, useParams } from "react-router-dom";
import { ExternalLink, Pencil, Mail, Activity, Trash2, Users, Link2, RefreshCw, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useStatusPage, useSetStatusPageMonitors, useRegenerateAccessToken, type StatusPageMonitorEntry } from "@/lib/queries/status-pages";
import { useMonitors } from "@/lib/queries/monitors";
import { useSubscribers, useDeleteSubscriber } from "@/lib/queries/subscribers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RelativeTime } from "@/components/relative-time";
import { MonitorStatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";

function StatusPageDetailSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      <div className="mb-8 flex items-center gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
      <Skeleton className="mb-4 h-9 w-48" />
      <div className="divide-y divide-border border-t border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export function StatusPageDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useStatusPage(id!);
  const { data: allMonitors } = useMonitors();
  const { data: subscribers } = useSubscribers(id!);
  const deleteSubscriber = useDeleteSubscriber(id!);
  const setMonitors = useSetStatusPageMonitors(id!);
  const regenerateToken = useRegenerateAccessToken(id!);

  if (isLoading) return <StatusPageDetailSkeleton />;
  if (!data) return <p className="text-muted-foreground">Status page not found</p>;

  const { statusPage, monitors: linkedMonitors } = data;
  const linkedMap = new Map(linkedMonitors.map((m) => [m.monitorId, m.groupName ?? ""]));

  const toggleMonitor = (monitorId: string) => {
    const next = new Map(linkedMap);
    if (next.has(monitorId)) {
      next.delete(monitorId);
    } else {
      next.set(monitorId, "");
    }
    const payload: StatusPageMonitorEntry[] = [...next.entries()].map(([id, groupName]) => ({
      monitorId: id,
      groupName: groupName || null,
    }));
    setMonitors.mutate(payload, {
      onSuccess: () => toast.success("Monitors updated"),
      onError: () => toast.error("Failed to update monitors"),
    });
  };

  const updateGroup = (monitorId: string, groupName: string) => {
    const next = new Map(linkedMap);
    next.set(monitorId, groupName);
    const payload: StatusPageMonitorEntry[] = [...next.entries()].map(([id, g]) => ({
      monitorId: id,
      groupName: g || null,
    }));
    setMonitors.mutate(payload, {
      onSuccess: () => toast.success("Group updated"),
      onError: () => toast.error("Failed to update group"),
    });
  };

  const subscriberCount = subscribers?.length ?? 0;

  const inviteLink = !statusPage.isPublic && statusPage.accessToken
    ? `${window.location.origin}/status/${statusPage.slug}?token=${statusPage.accessToken}`
    : null;

  const copyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied to clipboard");
  };

  const handleRegenerateToken = () => {
    regenerateToken.mutate(undefined, {
      onSuccess: () => toast.success("New invite link generated. Old link is now invalid."),
      onError: () => toast.error("Failed to regenerate link"),
    });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Status page"
        title={statusPage.name}
        description={`/status/${statusPage.slug}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/status/${statusPage.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Live
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/dashboard/status-pages/${statusPage.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
        }
      />

      {/* Inline stats */}
      <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-baseline gap-1.5 text-sm">
          <span className="font-mono tnum text-xl font-bold leading-none tracking-tight">{linkedMonitors.length}</span>
          <span className="text-xs text-muted-foreground">monitor{linkedMonitors.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-baseline gap-1.5 text-sm">
          <span className="font-mono tnum text-xl font-bold leading-none tracking-tight">{subscriberCount}</span>
          <span className="text-xs text-muted-foreground">subscriber{subscriberCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-3 w-3 rounded-full ring-1 ring-white/10" style={{ backgroundColor: statusPage.brandColor }} />
          <span className="font-mono text-xs text-muted-foreground">{statusPage.brandColor}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <Badge variant={statusPage.isPublic ? "default" : "secondary"} className="font-mono text-[10px] uppercase tracking-[0.12em]">
            {statusPage.isPublic ? "Public" : "Private"}
          </Badge>
          {!statusPage.isPublic && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-6 gap-1.5 px-2 text-xs"
                onClick={copyInviteLink}
                disabled={!inviteLink}
              >
                <Link2 className="h-3 w-3" />
                Copy invite link
              </Button>
              <ConfirmDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    title="Regenerate invite link (old link will stop working)"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                }
                title="Regenerate invite link?"
                description="The current invite link will stop working immediately. Anyone with the old link will lose access."
                onConfirm={handleRegenerateToken}
                destructive
              />
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="monitors">
        <TabsList className="mb-0">
          <TabsTrigger value="monitors">
            <Activity className="mr-2 h-4 w-4" />
            Monitors
            {linkedMonitors.length > 0 && (
              <span className="ml-1.5 rounded-full bg-brand/10 px-1.5 py-0.5 font-mono tnum text-[10px] font-semibold text-brand">
                {linkedMonitors.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="subscribers">
            <Mail className="mr-2 h-4 w-4" />
            Subscribers
            {subscriberCount > 0 && (
              <span className="ml-1.5 rounded-full bg-brand/10 px-1.5 py-0.5 font-mono tnum text-[10px] font-semibold text-brand">
                {subscriberCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Monitors tab */}
        <TabsContent value="monitors" className="mt-0">
          {allMonitors && allMonitors.length > 0 ? (
            <>
              <p className="border-t border-border py-3 text-xs text-muted-foreground">
                Select which monitors appear on this status page. Optionally assign a group label to organize them.
              </p>
              <div className="divide-y divide-border border-b border-border">
                {allMonitors.map((monitor) => {
                  const linked = linkedMap.has(monitor.id);
                  const groupValue = linkedMap.get(monitor.id) ?? "";
                  return (
                    <div key={monitor.id} className={cn(
                      "flex w-full items-center gap-3 py-3 transition-colors",
                      linked ? "text-foreground" : "text-muted-foreground",
                    )}>
                      <button
                        type="button"
                        onClick={() => toggleMonitor(monitor.id)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer group"
                      >
                        <div className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold transition-colors",
                          linked
                            ? "border-brand bg-brand text-brand-foreground"
                            : "border-muted-foreground/30 group-hover:border-muted-foreground/60",
                        )}>
                          {linked && "✓"}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium">{monitor.name}</span>
                          <span className="ml-2 font-mono text-xs text-muted-foreground truncate">{monitor.url}</span>
                        </div>
                      </button>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <MonitorStatusBadge status={monitor.status} />
                        {linked && (
                          <div className="flex items-center gap-1.5">
                            <Tag className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                            <Input
                              className="h-7 w-32 text-xs px-2"
                              placeholder="Group name"
                              value={groupValue}
                              onChange={(e) => {
                                linkedMap.set(monitor.id, e.target.value);
                              }}
                              onBlur={(e) => updateGroup(monitor.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="border-t border-border py-12 text-center">
              <Activity className="mx-auto mb-3 h-7 w-7 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No monitors available.{" "}
                <Link to="/dashboard/monitors/new" className="text-brand hover:underline">
                  Create one
                </Link>{" "}
                first.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Subscribers tab */}
        <TabsContent value="subscribers" className="mt-0">
          {subscribers && subscribers.length > 0 ? (
            <div className="border-t border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Email</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Subscribed</TableHead>
                    <TableHead className="w-[60px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-mono text-sm">{sub.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-[10px] uppercase tracking-[0.12em]",
                            sub.isVerified
                              ? "bg-success/10 text-success-foreground border-success/30"
                              : "bg-warning/10 text-warning-foreground border-warning/30",
                          )}
                        >
                          {sub.isVerified ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <RelativeTime date={sub.createdAt} />
                      </TableCell>
                      <TableCell className="text-right">
                        <ConfirmDialog
                          trigger={
                            <Button variant="ghost" size="sm" aria-label="Remove subscriber" className="h-8 w-8 p-0 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                          title="Remove subscriber?"
                          description={`This will remove ${sub.email} from notifications.`}
                          onConfirm={() =>
                            deleteSubscriber.mutate(sub.id, {
                              onSuccess: () => toast.success("Subscriber removed"),
                            })
                          }
                          destructive
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="border-t border-border py-12 text-center">
              <Users className="mx-auto mb-3 h-7 w-7 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No subscribers yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
