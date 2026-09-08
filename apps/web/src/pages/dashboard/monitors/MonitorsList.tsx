import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, ShieldAlert, Globe, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMonitors, useDeleteMonitor } from "@/lib/queries/monitors";
import type { Monitor } from "@uptimecrow/shared";
import { Button } from "@/components/ui/button";
import { MonitorStatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useTableDensity,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { RelativeTime } from "@/components/relative-time";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FilterBar, matchesQuery, type FilterSegment } from "@/components/filter-bar";

/**
 * The monitor list, made to scale.
 *
 * What changed:
 *  · Filter bar: search, counted status segments, density switch.
 *  · Density: compact rows are 34px, and the choice persists per viewer.
 *  · Paging: "Show more" after 50 rows, so 200 monitors do not blow up the DOM.
 *  · Row-cards instead of a table on mobile: no horizontal scrolling, one tap
 *    to the detail page, actions at a 44px target.
 *  · Two distinct empty states: nothing created yet (first-run) versus a
 *    filter that matched nothing (filtered).
 */
const PAGE_SIZE = 50;

type StatusFilter = "all" | "up" | "down" | "degraded" | "unknown";

function MonitorsListSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="divide-y divide-border border-t border-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3.5">
            <Skeleton className="h-2 w-2 rounded-full shrink-0" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48 hidden md:block" />
            <Skeleton className="h-4 w-28 ml-auto" />
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: Monitor["status"] }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
      {status === "down" && (
        <span className="absolute inline-flex h-full w-full animate-ping-soft rounded-full bg-danger" />
      )}
      <span
        className={cn("relative inline-flex h-2 w-2 rounded-full", {
          "bg-success": status === "up",
          "bg-danger": status === "down",
          "bg-warning": status === "degraded",
          "bg-muted-foreground": status === "unknown",
        })}
      />
    </span>
  );
}

function daysUntil(iso: string | Date) {
  return Math.floor((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function ExpiryCell({
  iso,
  warnDays,
  icon: Icon,
  label,
}: {
  iso: string | Date | null | undefined;
  warnDays: number;
  icon: React.ElementType;
  label: string;
}) {
  if (iso == null) return <span className="text-xs text-text3">—</span>;
  const days = daysUntil(iso);
  const expired = days < 0;
  const warning = days < warnDays;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 font-mono tnum text-xs",
            expired
              ? "text-danger-foreground"
              : warning
                ? "text-warning-foreground"
                : "text-success-foreground",
          )}
        >
          <Icon className="h-3 w-3" aria-hidden="true" />
          {expired ? "Expired" : `${days}d`}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {expired
          ? `${label} has expired`
          : `${label} expires in ${days} day${days !== 1 ? "s" : ""}`}
      </TooltipContent>
    </Tooltip>
  );
}

export function MonitorsList() {
  const { data: monitors, isLoading } = useMonitors();
  const deleteMutation = useDeleteMonitor();
  const { density, toggle: toggleDensity } = useTableDensity();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Monitor deleted"),
      onError: () => toast.error("Failed to delete monitor"),
    });
  };

  const counts = useMemo(() => {
    const base = { all: 0, up: 0, down: 0, degraded: 0, unknown: 0 };
    for (const m of monitors ?? []) {
      base.all += 1;
      base[m.status as keyof typeof base] += 1;
    }
    return base;
  }, [monitors]);

  const filtered = useMemo(() => {
    return (monitors ?? []).filter(
      (m) =>
        (status === "all" || m.status === status) && matchesQuery(query, m.name, m.url),
    );
  }, [monitors, status, query]);

  const segments: FilterSegment<StatusFilter>[] = [
    { value: "all", label: "All", count: counts.all },
    { value: "down", label: "Down", count: counts.down, tone: "danger" },
    { value: "degraded", label: "Slow", count: counts.degraded, tone: "warning" },
    { value: "up", label: "Up", count: counts.up, tone: "success" },
    { value: "unknown", label: "Pending", count: counts.unknown },
  ];

  if (isLoading) return <MonitorsListSkeleton />;

  const addButton = (
    <Button asChild>
      <Link to="/dashboard/monitors/new">
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add Monitor
      </Link>
    </Button>
  );

  const rows = filtered.slice(0, visible);

  return (
    <TooltipProvider>
      <div>
        <PageHeader
          eyebrow="The watch"
          title="Monitors"
          description="Track the uptime of your services"
          action={addButton}
        />

        {!monitors?.length ? (
          <EmptyState
            variant="first-run"
            eyebrow="The watch"
            title="No monitors yet"
            description="Paste a URL and you'll see the first check result in seconds."
            action={addButton}
          />
        ) : (
          <>
            <FilterBar
              query={query}
              onQueryChange={(v) => {
                setQuery(v);
                setVisible(PAGE_SIZE);
              }}
              placeholder="Search name or URL…"
              segments={segments}
              activeSegment={status}
              onSegmentChange={(v) => {
                setStatus(v);
                setVisible(PAGE_SIZE);
              }}
              density={density}
              onDensityToggle={toggleDensity}
            />

            {filtered.length === 0 ? (
              <EmptyState
                variant="filtered"
                icon={Activity}
                title="No monitors match"
                description="Try a different search term or clear the status filter."
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuery("");
                      setStatus("all");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <>
                {/* ── Mobile: row-cards ────────────────────────────────── */}
                <ul className="divide-y divide-border md:hidden">
                  {rows.map((monitor) => (
                    <li key={monitor.id}>
                      <div
                        className={cn(
                          "flex items-center gap-3 py-3",
                          monitor.status === "down" && "border-l-2 border-l-danger pl-3",
                          monitor.status === "degraded" && "border-l-2 border-l-warning pl-3",
                        )}
                      >
                        <StatusDot status={monitor.status} />
                        <Link
                          to={`/dashboard/monitors/${monitor.id}`}
                          className="focus-ring min-w-0 flex-1 py-1"
                        >
                          <span className="block truncate font-medium">{monitor.name}</span>
                          <span className="mt-0.5 block truncate font-mono text-[11px] text-text3">
                            {monitor.url}
                          </span>
                          <span className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                            <MonitorStatusBadge status={monitor.status} />
                            <span className="font-mono tnum">
                              {monitor.lastResponseMs != null ? `${monitor.lastResponseMs}ms` : "—"}
                            </span>
                            {monitor.lastCheckedAt && (
                              <RelativeTime date={monitor.lastCheckedAt} />
                            )}
                          </span>
                        </Link>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button variant="ghost" size="icon-touch" asChild>
                            <Link
                              to={`/dashboard/monitors/${monitor.id}/edit`}
                              aria-label={`Edit ${monitor.name}`}
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </Link>
                          </Button>
                          <ConfirmDialog
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon-touch"
                                className="text-destructive"
                                aria-label={`Delete ${monitor.name}`}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            }
                            title="Delete monitor?"
                            description={`This will permanently delete "${monitor.name}" and all its check history.`}
                            onConfirm={() => handleDelete(monitor.id)}
                            destructive
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* ── Desktop: tablo ──────────────────────────────────── */}
                <div className="hidden md:block">
                  <Table density={density}>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Name</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Response</TableHead>
                        <TableHead>Last Check</TableHead>
                        <TableHead className="hidden lg:table-cell">SSL</TableHead>
                        <TableHead className="hidden lg:table-cell">Domain</TableHead>
                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((monitor) => (
                        <TableRow
                          key={monitor.id}
                          className={cn(
                            monitor.status === "down" && "border-l-2 border-l-danger",
                            monitor.status === "degraded" && "border-l-2 border-l-warning",
                          )}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <StatusDot status={monitor.status} />
                              <Link
                                to={`/dashboard/monitors/${monitor.id}`}
                                className="focus-ring font-medium text-foreground transition-colors duration-1 hover:text-brand"
                              >
                                {monitor.name}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[180px] truncate font-mono text-[12px] text-muted-foreground">
                            {monitor.url}
                          </TableCell>
                          <TableCell>
                            <MonitorStatusBadge status={monitor.status} />
                          </TableCell>
                          <TableCell className="font-mono tnum text-sm text-muted-foreground">
                            {monitor.lastResponseMs != null ? `${monitor.lastResponseMs}ms` : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {monitor.lastCheckedAt ? (
                              <RelativeTime date={monitor.lastCheckedAt} />
                            ) : (
                              "Never"
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {monitor.url.startsWith("https://") ? (
                              <ExpiryCell
                                iso={monitor.sslExpiresAt}
                                warnDays={monitor.sslDaysWarning ?? 30}
                                icon={ShieldAlert}
                                label="SSL certificate"
                              />
                            ) : (
                              <span className="text-xs text-text3">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <ExpiryCell
                              iso={monitor.domainExpiresAt}
                              warnDays={monitor.domainDaysWarning ?? 30}
                              icon={Globe}
                              label="Domain"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" asChild>
                                    <Link
                                      to={`/dashboard/monitors/${monitor.id}/edit`}
                                      aria-label={`Edit ${monitor.name}`}
                                    >
                                      <Pencil className="h-4 w-4" aria-hidden="true" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                              <ConfirmDialog
                                trigger={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    aria-label={`Delete ${monitor.name}`}
                                  >
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                }
                                title="Delete monitor?"
                                description={`This will permanently delete "${monitor.name}" and all its check history.`}
                                onConfirm={() => handleDelete(monitor.id)}
                                destructive
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Sayfalama */}
                {filtered.length > visible && (
                  <div className="flex items-center justify-center gap-3 border-t border-border py-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-text3">
                      {visible} / {filtered.length}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    >
                      Show {Math.min(PAGE_SIZE, filtered.length - visible)} more
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
