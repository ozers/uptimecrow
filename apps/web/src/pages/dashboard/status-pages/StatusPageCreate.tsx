import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, Check } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { normalizeUrl } from "@/lib/utils";
import { useMonitors } from "@/lib/queries/monitors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { MonitorStatusBadge } from "@/components/status-badge";
import type { Monitor, StatusPage } from "@uptimecrow/shared";

interface NewMonitor {
  id: string; // temp client id
  name: string;
  url: string;
  intervalSeconds: number;
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function StatusPageCreate() {
  const navigate = useNavigate();
  const { data: existingMonitors } = useMonitors();
  const [loading, setLoading] = useState(false);

  // Status page fields
  const [pageName, setPageName] = useState("");
  const [slug, setSlug] = useState("");
  const [brandColor, setBrandColor] = useState("#00e676");
  const [isPublic, setIsPublic] = useState(true);

  // Monitor selection
  const [selectedExisting, setSelectedExisting] = useState<Set<string>>(new Set());
  const [newMonitors, setNewMonitors] = useState<NewMonitor[]>([]);

  useEffect(() => {
    if (pageName) setSlug(toSlug(pageName));
  }, [pageName]);

  const addNewMonitor = () => {
    setNewMonitors((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", url: "", intervalSeconds: 60 },
    ]);
  };

  const updateNewMonitor = (id: string, field: keyof NewMonitor, value: string | number) => {
    setNewMonitors((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );
  };

  const removeNewMonitor = (id: string) => {
    setNewMonitors((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleExisting = (monitorId: string) => {
    setSelectedExisting((prev) => {
      const next = new Set(prev);
      if (next.has(monitorId)) next.delete(monitorId);
      else next.add(monitorId);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pageName || !slug) {
      toast.error("Page name and slug are required");
      return;
    }

    const hasMonitors = selectedExisting.size > 0 || newMonitors.some((m) => m.name && m.url);
    if (!hasMonitors) {
      toast.error("Add at least one monitor");
      return;
    }

    setLoading(true);
    try {
      // 1. Create status page
      const { statusPage } = await api.post<{ statusPage: StatusPage }>("/api/status-pages", {
        name: pageName,
        slug,
        brandColor,
        isPublic,
      });

      // 2. Create new monitors
      const createdMonitorIds: string[] = [...selectedExisting];

      for (const m of newMonitors) {
        if (!m.name || !m.url) continue;
        const { monitor } = await api.post<{ monitor: Monitor }>("/api/monitors", {
          name: m.name,
          url: normalizeUrl(m.url),
          intervalSeconds: m.intervalSeconds,
          type: "http",
        });
        createdMonitorIds.push(monitor.id);
      }

      // 3. Link monitors to status page
      if (createdMonitorIds.length > 0) {
        await api.put(`/api/status-pages/${statusPage.id}/monitors`, {
          monitorIds: createdMonitorIds,
        });
      }

      toast.success("Status page created with monitors!");
      navigate(`/dashboard/status-pages/${statusPage.id}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to create status page");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="New status page"
        title="Create Status Page"
        description="Set up a status page and add the services you want to monitor"
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
        {/* Status page details */}
        <section className="space-y-6">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Page details
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="name">Page Name</Label>
              <Input
                id="name"
                placeholder="My Service Status"
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">/status/</span>
                <Input
                  id="slug"
                  className="font-mono"
                  placeholder="my-service"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Brand Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    className="h-10 w-14 cursor-pointer p-1"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                  />
                  <Input
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="flex-1 font-mono"
                  />
                </div>
              </div>
              <div className="flex items-end gap-3 pb-1">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-brand"
                />
                <Label htmlFor="isPublic" className="cursor-pointer">
                  Publicly accessible
                </Label>
              </div>
            </div>
        </section>

        {/* Monitors */}
        <section className="space-y-4 border-t border-border pt-6">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Monitors
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add the services that will appear on this status page
              </p>
            </div>
            {/* Existing monitors */}
            {existingMonitors && existingMonitors.length > 0 && (
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Existing monitors
                </p>
                <div className="space-y-2">
                  {existingMonitors.map((monitor) => {
                    const selected = selectedExisting.has(monitor.id);
                    return (
                      <button
                        key={monitor.id}
                        type="button"
                        onClick={() => toggleExisting(monitor.id)}
                        className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                          selected
                            ? "border-brand/30 bg-brand/10"
                            : "border-border hover:border-brand/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                              selected
                                ? "border-brand bg-brand text-brand-foreground"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {selected && <Check className="h-3 w-3" />}
                          </div>
                          <div>
                            <span className="text-sm font-medium">{monitor.name}</span>
                            <span className="ml-2 font-mono text-xs text-muted-foreground">{monitor.url}</span>
                          </div>
                        </div>
                        <MonitorStatusBadge status={monitor.status} />
                      </button>
                    );
                  })}
                </div>
                {newMonitors.length > 0 && <Separator className="my-4" />}
              </div>
            )}

            {/* New monitors */}
            {newMonitors.length > 0 && (
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  New monitors
                </p>
                <div className="space-y-3">
                  {newMonitors.map((m) => (
                    <div key={m.id} className="rounded-lg border border-border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-[0.12em]">New</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-destructive"
                          onClick={() => removeNewMonitor(m.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Name</Label>
                          <Input
                            placeholder="API Server"
                            value={m.name}
                            onChange={(e) => updateNewMonitor(m.id, "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">URL</Label>
                          <Input
                            className="font-mono"
                            placeholder="api.example.com"
                            value={m.url}
                            onChange={(e) => updateNewMonitor(m.id, "url", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="mt-3 w-32 space-y-1.5">
                        <Label className="text-xs">Interval (sec)</Label>
                        <Input
                          type="number"
                          className="font-mono tnum"
                          value={m.intervalSeconds}
                          onChange={(e) => updateNewMonitor(m.id, "intervalSeconds", Number(e.target.value))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={addNewMonitor}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Monitor
            </Button>
        </section>

        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create Status Page"}
        </Button>
      </form>
    </div>
  );
}
