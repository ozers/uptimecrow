import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Globe,
  LayoutDashboard,
  Plus,
  Settings,
  Wrench,
  Moon,
  Sun,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMonitors } from "@/lib/queries/monitors";
import { useStatusPages } from "@/lib/queries/status-pages";
import { useIncidents } from "@/lib/queries/incidents";
import { useTheme } from "@/lib/theme";
import { Dialog, DialogContent } from "@/components/ui/dialog";

/**
 * DALGA 3 — Command palette (⌘K / Ctrl+K).
 *
 * Neden: 20+ monitörde sidebar navigasyonu yetmiyor; kullanıcı "hangi
 * monitör down'dı" diye listeyi tarıyor. Palette hem arama hem hızlı aksiyon.
 *
 * Kapsam (kasıtlı olarak dar):
 *  · Navigasyon: beş bölüm.
 *  · Aksiyon: yeni monitör, yeni status page, tema değiştir.
 *  · Kayıtlar: monitörler (durum noktalı), status page'ler, açık incident'lar.
 *
 * Bilerek yapılmayanlar: sonuç önizlemesi, çok adımlı komut, fuzzy skorlama.
 * Basit substring eşleşmesi 200 kayda kadar yeterli ve tahmin edilebilir.
 *
 * Bağımlılık eklemedik — cmdk yerine 60 satır liste + klavye yönetimi.
 */
type Item = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: React.ElementType;
  /** Solda küçük durum noktası rengi (monitörler için). */
  dot?: "success" | "danger" | "warning" | "muted";
  run: () => void;
};

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { data: monitors } = useMonitors();
  const { data: statusPages } = useStatusPages();
  const { data: incidents } = useIncidents();
  const listRef = React.useRef<HTMLUListElement>(null);

  // ⌘K / Ctrl+K aç-kapat
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  const go = React.useCallback(
    (to: string) => () => {
      setOpen(false);
      navigate(to);
    },
    [navigate],
  );

  const items = React.useMemo<Item[]>(() => {
    const nav: Item[] = [
      { id: "n-overview", label: "Overview", group: "Go to", icon: LayoutDashboard, run: go("/dashboard") },
      { id: "n-pages", label: "Status Pages", group: "Go to", icon: Globe, run: go("/dashboard/status-pages") },
      { id: "n-monitors", label: "Monitors", group: "Go to", icon: Activity, run: go("/dashboard/monitors") },
      { id: "n-incidents", label: "Incidents", group: "Go to", icon: AlertTriangle, run: go("/dashboard/incidents") },
      { id: "n-maintenance", label: "Maintenance", group: "Go to", icon: Wrench, run: go("/dashboard/maintenance") },
      { id: "n-settings", label: "Settings", group: "Go to", icon: Settings, run: go("/dashboard/settings") },
    ];

    const actions: Item[] = [
      { id: "a-monitor", label: "New monitor", hint: "Paste a URL", group: "Actions", icon: Plus, run: go("/dashboard/monitors/new") },
      { id: "a-page", label: "New status page", group: "Actions", icon: Plus, run: go("/dashboard/status-pages/new") },
      {
        id: "a-theme",
        label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
        group: "Actions",
        icon: theme === "dark" ? Sun : Moon,
        run: () => {
          toggle();
          setOpen(false);
        },
      },
    ];

    const monitorItems: Item[] = (monitors ?? []).map((m) => ({
      id: `m-${m.id}`,
      label: m.name,
      hint: m.url,
      group: "Monitors",
      icon: Activity,
      dot:
        m.status === "up"
          ? "success"
          : m.status === "down"
            ? "danger"
            : m.status === "degraded"
              ? "warning"
              : "muted",
      run: go(`/dashboard/monitors/${m.id}`),
    }));

    const pageItems: Item[] = (statusPages ?? []).map((p) => ({
      id: `p-${p.id}`,
      label: p.name,
      hint: p.slug,
      group: "Status pages",
      icon: Globe,
      run: go(`/dashboard/status-pages/${p.id}`),
    }));

    const openIncidents: Item[] = (incidents ?? [])
      .filter((i) => i.status !== "resolved")
      .map((i) => ({
        id: `i-${i.id}`,
        label: i.title,
        hint: i.status,
        group: "Open incidents",
        icon: AlertTriangle,
        dot: "danger",
        run: go(`/dashboard/incidents/${i.id}`),
      }));

    return [...openIncidents, ...nav, ...actions, ...monitorItems, ...pageItems];
  }, [monitors, statusPages, incidents, go, theme, toggle]);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? items.filter(
          (i) =>
            i.label.toLowerCase().includes(q) || (i.hint ?? "").toLowerCase().includes(q),
        )
      : items.slice(0, 14);
    return matched.slice(0, 40);
  }, [items, query]);

  React.useEffect(() => {
    setActive(0);
  }, [query]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[active]?.run();
    }
  };

  // Aktif satırı görünür tut (scrollIntoView kullanmadan)
  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.children[active] as HTMLElement | undefined;
    if (!el) return;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = bottom - list.clientHeight;
    }
  }, [active]);

  let lastGroup = "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="top-[15%] max-w-lg translate-y-0 gap-0 overflow-hidden p-0"
        aria-label="Command palette"
      >
        <div className="border-b border-border px-4">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search monitors, pages, actions…"
            aria-label="Search monitors, pages, actions"
            className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-text3"
          />
        </div>

        {results.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No matches for “{query}”.
          </p>
        ) : (
          <ul ref={listRef} role="listbox" className="max-h-80 overflow-y-auto p-2">
            {results.map((item, i) => {
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;
              return (
                <React.Fragment key={item.id}>
                  {showGroup && (
                    <li
                      role="presentation"
                      className="px-2 pb-1 pt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-text3 first:pt-1"
                    >
                      {item.group}
                    </li>
                  )}
                  <li
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={item.run}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors duration-1",
                      i === active ? "bg-accent text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {item.dot ? (
                      <span
                        className={cn("h-2 w-2 shrink-0 rounded-full", {
                          "bg-success": item.dot === "success",
                          "bg-danger": item.dot === "danger",
                          "bg-warning": item.dot === "warning",
                          "bg-muted-foreground": item.dot === "muted",
                        })}
                        aria-hidden="true"
                      />
                    ) : (
                      <item.icon className="h-4 w-4 shrink-0 text-text3" aria-hidden="true" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {item.label}
                    </span>
                    {item.hint && (
                      <span className="max-w-[40%] truncate font-mono text-[11px] text-text3">
                        {item.hint}
                      </span>
                    )}
                    {i === active && (
                      <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-text3" aria-hidden="true" />
                    )}
                  </li>
                </React.Fragment>
              );
            })}
          </ul>
        )}

        <div className="flex items-center gap-4 border-t border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-text3">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
