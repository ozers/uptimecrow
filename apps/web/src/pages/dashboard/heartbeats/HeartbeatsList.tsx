import { useState } from "react";
import { Plus, Heart, Trash2, Copy, Check, Clock, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useHeartbeats, useCreateHeartbeat, useDeleteHeartbeat, useUpdateHeartbeat } from "@/lib/queries/heartbeats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { RelativeTime } from "@/components/relative-time";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import type { Heartbeat } from "@uptimecrow/shared";

const STATUS_COLORS: Record<string, string> = {
  healthy: "bg-success/15 text-success-foreground border-success/30",
  late: "bg-danger/15 text-danger-foreground border-danger/30",
  paused: "bg-muted-foreground/15 text-muted-foreground border-border/30",
  unknown: "bg-warning/15 text-warning-foreground border-warning/30",
};

function formatSeconds(s: number): string {
  if (s < 3600) return `${s / 60}m`;
  if (s < 86400) return `${s / 3600}h`;
  return `${s / 86400}d`;
}

function PingUrl({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/hb/${slug}`;

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <code className="truncate text-xs text-muted-foreground font-mono max-w-[280px]">{url}</code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
        title="Copy ping URL"
        aria-label="Copy ping URL"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-success-foreground" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function HeartbeatRow({
  hb,
  onDelete,
  onToggle,
}: {
  hb: Heartbeat;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 py-3.5 px-4 border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("font-medium text-sm truncate", !hb.isActive && "text-muted-foreground line-through")}>
            {hb.name}
          </span>
          <Badge
            variant="outline"
            className={`text-xs capitalize ${STATUS_COLORS[hb.status] ?? ""}`}
          >
            {hb.status}
          </Badge>
        </div>
        <PingUrl slug={hb.slug} />
      </div>

      <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <Clock className="h-3.5 w-3.5" />
        <span>Every {formatSeconds(hb.period)}, {formatSeconds(hb.grace)} grace</span>
      </div>

      <div className="hidden md:block text-xs text-muted-foreground shrink-0 w-28 text-right">
        {hb.lastPingAt ? (
          <>Last ping <RelativeTime date={new Date(hb.lastPingAt)} /></>
        ) : (
          <span className="text-muted-foreground/50">No pings yet</span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onToggle(hb.id, !hb.isActive)}
          className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title={hb.isActive ? "Pause" : "Resume"}
          aria-label={hb.isActive ? "Pause heartbeat" : "Resume heartbeat"}
        >
          {hb.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <ConfirmDialog
          title="Delete heartbeat?"
          description={`"${hb.name}" will be permanently deleted and its ping URL will stop working.`}
          onConfirm={() => onDelete(hb.id)}
          trigger={
            <button
              type="button"
              className="shrink-0 rounded p-1.5 text-muted-foreground hover:text-danger-foreground hover:bg-danger/10 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          }
        />
      </div>
    </div>
  );
}

const PERIOD_OPTIONS = [
  { label: "1 minute", value: 60 },
  { label: "5 minutes", value: 300 },
  { label: "15 minutes", value: 900 },
  { label: "30 minutes", value: 1800 },
  { label: "1 hour", value: 3600 },
  { label: "6 hours", value: 21600 },
  { label: "12 hours", value: 43200 },
  { label: "1 day", value: 86400 },
];

const GRACE_OPTIONS = [
  { label: "1 minute", value: 60 },
  { label: "5 minutes", value: 300 },
  { label: "15 minutes", value: 900 },
  { label: "30 minutes", value: 1800 },
  { label: "1 hour", value: 3600 },
];

function CreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [period, setPeriod] = useState(86400);
  const [grace, setGrace] = useState(300);
  const create = useCreateHeartbeat();

  const reset = () => {
    setName("");
    setPeriod(86400);
    setGrace(300);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), period, grace },
      {
        onSuccess: () => {
          toast.success("Heartbeat created");
          reset();
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "Failed to create heartbeat");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Heartbeat Monitor</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="hb-name">Name</Label>
            <Input
              id="hb-name"
              placeholder="Daily backup job"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Expected every</Label>
              <Select value={String(period)} onValueChange={(v) => setPeriod(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Grace period</Label>
              <Select value={String(grace)} onValueChange={(v) => setGrace(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRACE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Your service must ping the URL every <strong>{formatSeconds(period)}</strong>.
            If no ping is received within <strong>{formatSeconds(grace)}</strong> of the deadline,
            the heartbeat goes <span className="text-danger-foreground">late</span>.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || create.isPending}>
            {create.isPending ? "Creating…" : "Create heartbeat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function HeartbeatsList() {
  const { data: heartbeats, isLoading } = useHeartbeats();
  const deleteHb = useDeleteHeartbeat();
  const updateHb = useUpdateHeartbeat();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDelete = (id: string) => {
    deleteHb.mutate(id, {
      onSuccess: () => toast.success("Heartbeat deleted"),
      onError: () => toast.error("Failed to delete heartbeat"),
    });
  };

  const handleToggle = (id: string, isActive: boolean) => {
    updateHb.mutate(
      { id, isActive },
      {
        onSuccess: () => toast.success(isActive ? "Heartbeat resumed" : "Heartbeat paused"),
        onError: () => toast.error("Failed to update heartbeat"),
      },
    );
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="divide-y divide-border border rounded-lg">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Heartbeats"
        description="Monitor cron jobs and scheduled tasks by having them ping a unique URL."
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New heartbeat
          </Button>
        }
      />

      {!heartbeats?.length ? (
        <EmptyState
          icon={Heart}
          title="No heartbeat monitors yet"
          description="Create a heartbeat monitor and have your cron job or scheduled task ping the URL to confirm it ran."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New heartbeat
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {heartbeats.map((hb) => (
            <HeartbeatRow key={hb.id} hb={hb} onDelete={handleDelete} onToggle={handleToggle} />
          ))}
        </div>
      )}

      <CreateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
