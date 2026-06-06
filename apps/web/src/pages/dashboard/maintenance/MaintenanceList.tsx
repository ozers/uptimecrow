import { useMemo, useState } from "react";
import { Plus, Wrench, Trash2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import {
  useMaintenanceWindows,
  useCreateMaintenanceWindow,
  useDeleteMaintenanceWindow,
} from "@/lib/queries/maintenance";
import { useStatusPages } from "@/lib/queries/status-pages";
import { useMonitors } from "@/lib/queries/monitors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LoadError } from "@/components/load-error";
import { RelativeTime } from "@/components/relative-time";
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

function toLocalInputValue(iso: string | null | undefined): string {
  // Convert an ISO string to the `YYYY-MM-DDTHH:mm` format a datetime-local input expects
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(local: string): string {
  // datetime-local is in the user's local timezone; new Date() interprets it as such.
  return new Date(local).toISOString();
}

function defaultStart(): string {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return toLocalInputValue(d.toISOString());
}

function defaultEnd(): string {
  const d = new Date();
  d.setHours(d.getHours() + 2, 0, 0, 0);
  return toLocalInputValue(d.toISOString());
}

interface FormState {
  statusPageId: string;
  title: string;
  body: string;
  scheduledStart: string;
  scheduledEnd: string;
  monitorIds: string[];
}

function emptyForm(firstStatusPageId: string): FormState {
  return {
    statusPageId: firstStatusPageId,
    title: "",
    body: "",
    scheduledStart: defaultStart(),
    scheduledEnd: defaultEnd(),
    monitorIds: [],
  };
}

function MaintenanceSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="divide-y divide-border border-t border-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-4">
            <Skeleton className="h-2 w-2 rounded-full shrink-0" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-24 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MaintenanceList() {
  const { data: windows, isLoading, isError, refetch } = useMaintenanceWindows();
  const { data: statusPages } = useStatusPages();
  const { data: monitors } = useMonitors();
  const create = useCreateMaintenanceWindow();
  const del = useDeleteMaintenanceWindow();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);

  const firstStatusPageId = statusPages?.[0]?.id ?? "";

  const now = Date.now();

  const grouped = useMemo(() => {
    const active: typeof windows = [];
    const upcoming: typeof windows = [];
    const past: typeof windows = [];
    for (const w of windows ?? []) {
      const start = new Date(w.scheduledStart).getTime();
      const end = new Date(w.scheduledEnd).getTime();
      if (w.status === "cancelled" || w.status === "completed" || end < now) past.push(w);
      else if (start <= now && end >= now) active.push(w);
      else upcoming.push(w);
    }
    return { active, upcoming, past };
  }, [windows, now]);

  if (isLoading) return <MaintenanceSkeleton />;

  if (isError)
    return (
      <div>
        <PageHeader
          title="Maintenance"
          description="Schedule planned maintenance windows and stop incidents from paging subscribers during expected downtime"
        />
        <LoadError onRetry={() => refetch()} />
      </div>
    );

  const openCreate = () => {
    if (!firstStatusPageId) {
      toast.error("Create a status page first");
      return;
    }
    setForm(emptyForm(firstStatusPageId));
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form) return;
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      await create.mutateAsync({
        statusPageId: form.statusPageId,
        title: form.title.trim(),
        body: form.body.trim() || undefined,
        scheduledStart: fromLocalInputValue(form.scheduledStart),
        scheduledEnd: fromLocalInputValue(form.scheduledEnd),
        monitorIds: form.monitorIds,
      });
      toast.success("Maintenance window scheduled");
      setDialogOpen(false);
      setForm(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to schedule window");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await del.mutateAsync(id);
      toast.success("Window deleted");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to delete");
    }
  };

  const toggleMonitor = (id: string) => {
    setForm((f) => {
      if (!f) return f;
      const has = f.monitorIds.includes(id);
      return { ...f, monitorIds: has ? f.monitorIds.filter((m) => m !== id) : [...f.monitorIds, id] };
    });
  };

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Schedule planned maintenance windows and stop incidents from paging subscribers during expected downtime"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Window
          </Button>
        }
      />

      {!windows?.length ? (
        <EmptyState
          icon={Wrench}
          title="No maintenance windows"
          description="Schedule your first window to announce planned downtime on your status page"
        />
      ) : (
        <div className="space-y-8">
          {grouped.active.length > 0 && (
            <WindowGroup
              label="In progress"
              windows={grouped.active}
              onDelete={handleDelete}
              accent="text-blue-400"
            />
          )}
          {grouped.upcoming.length > 0 && (
            <WindowGroup
              label="Upcoming"
              windows={grouped.upcoming}
              onDelete={handleDelete}
              accent="text-violet-400"
            />
          )}
          {grouped.past.length > 0 && (
            <WindowGroup
              label="Past"
              windows={grouped.past}
              onDelete={handleDelete}
              accent="text-muted-foreground"
            />
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule maintenance window</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="mw-title">Title</Label>
                <Input
                  id="mw-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Database migration"
                />
              </div>
              <div>
                <Label htmlFor="mw-body">Description (optional)</Label>
                <Textarea
                  id="mw-body"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="We'll be performing a database upgrade; brief interruptions expected."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="mw-start">Starts</Label>
                  <Input
                    id="mw-start"
                    type="datetime-local"
                    value={form.scheduledStart}
                    onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="mw-end">Ends</Label>
                  <Input
                    id="mw-end"
                    type="datetime-local"
                    value={form.scheduledEnd}
                    onChange={(e) => setForm({ ...form, scheduledEnd: e.target.value })}
                  />
                </div>
              </div>
              {(statusPages?.length ?? 0) > 1 && (
                <div>
                  <Label>Status page</Label>
                  <Select
                    value={form.statusPageId}
                    onValueChange={(v) => setForm({ ...form, statusPageId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusPages?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Affected monitors (optional)</Label>
                <p className="mb-2 text-xs text-muted-foreground">
                  Checks still run so history stays accurate; we just won't create incidents or page subscribers.
                </p>
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                  {(monitors ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No monitors yet</p>
                  ) : (
                    monitors?.map((m) => (
                      <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-accent">
                        <input
                          type="checkbox"
                          checked={form.monitorIds.includes(m.id)}
                          onChange={() => toggleMonitor(m.id)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{m.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={create.isPending}>
              {create.isPending ? "Scheduling…" : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface GroupProps {
  label: string;
  windows: NonNullable<ReturnType<typeof useMaintenanceWindows>["data"]>;
  onDelete: (id: string) => void;
  accent: string;
}

function WindowGroup({ label, windows, onDelete, accent }: GroupProps) {
  return (
    <div>
      <div className={`mb-2 text-xs font-semibold uppercase tracking-widest ${accent}`}>{label}</div>
      <div className="divide-y divide-border border-t border-border">
        {windows.map((w) => {
          const isActive = label === "In progress";
          const statusIcon =
            w.status === "cancelled" ? XCircle
              : w.status === "completed" ? CheckCircle2
              : Clock;
          const StatusIcon = statusIcon;
          return (
            <div key={w.id} className="flex items-center gap-3 py-3">
              <StatusIcon className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-400" : "text-muted-foreground"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{w.title}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{w.status.replace("_", " ")}</Badge>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  <RelativeTime date={w.scheduledStart} /> → <RelativeTime date={w.scheduledEnd} />
                  {w.monitorIds.length > 0 && ` · ${w.monitorIds.length} monitor${w.monitorIds.length === 1 ? "" : "s"}`}
                </div>
              </div>
              <ConfirmDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete window"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                }
                title="Delete maintenance window?"
                description="This removes the scheduled window. Monitors will alert normally during that time."
                onConfirm={() => onDelete(w.id)}
                destructive
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
