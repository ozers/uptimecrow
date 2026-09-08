import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Globe,
  Settings,
  Zap,
  Wrench,
  Sun,
  Moon,
  User,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useAuthStore } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";

/**
 * Contrast and focus only — the information architecture is unchanged:
 * · Every /40, /60 and /70 alpha clip became the opaque `text-text3` token,
 *   so descriptions, group headings and icons clear AA.
 * · Every interactive row has `focus-ring`, so a keyboard user can see where
 *   they are in the sidebar.
 * · Transitions run on the motion tokens instead of ad-hoc durations.
 * · A ⌘K hint at the bottom, because an undiscoverable palette is no palette.
 */
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  desc?: string;
}

interface NavGroup {
  header?: string;
  items: NavItem[];
}

// Information architecture: status pages are the product — they lead. Below
// them, the monitoring machinery that feeds them. Overview sits on its own.
const navGroups: NavGroup[] = [
  {
    items: [{ label: "Overview", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    header: "Pages",
    items: [
      {
        label: "Status Pages",
        href: "/dashboard/status-pages",
        icon: Globe,
        desc: "Public pages & subscribers",
      },
    ],
  },
  {
    header: "Monitoring",
    items: [
      {
        label: "Monitors",
        href: "/dashboard/monitors",
        icon: Activity,
        desc: "HTTP, TCP & keyword checks",
      },
      {
        label: "Incidents",
        href: "/dashboard/incidents",
        icon: AlertTriangle,
        desc: "Communicate outages",
      },
      {
        label: "Maintenance",
        href: "/dashboard/maintenance",
        icon: Wrench,
        desc: "Schedule planned downtime",
      },
    ],
  },
];

interface SidebarContentProps {
  onNavClick?: () => void;
}

function NavRow({
  item,
  active,
  onNavClick,
}: {
  item: NavItem;
  active: boolean;
  onNavClick?: () => void;
}) {
  return (
    <Link
      to={item.href}
      onClick={onNavClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring group relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-1 ease-out",
        active
          ? "bg-brand/10 text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        item.desc && "py-2.5",
      )}
    >
      {/* Brand-green active accent rail */}
      <span
        className={cn(
          "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full transition-colors duration-1",
          active ? "bg-brand" : "bg-transparent",
        )}
        aria-hidden="true"
      />
      <item.icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-brand" : "text-text3",
          item.desc && "mt-0.5",
        )}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <span className="block font-mono text-[13px] uppercase tracking-[0.06em] leading-none">
          {item.label}
        </span>
        {item.desc && (
          <span
            className={cn(
              "mt-1 block truncate text-[11px] font-normal leading-none",
              active ? "text-muted-foreground" : "text-text3",
            )}
          >
            {item.desc}
          </span>
        )}
      </div>
    </Link>
  );
}

export function SidebarContent({ onNavClick }: SidebarContentProps) {
  const location = useLocation();
  const { user } = useAuthStore();
  const { theme, toggle } = useTheme();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(href);

  return (
    <>
      {/* Crow mark */}
      <div className="flex h-16 items-center border-b border-border px-5 shrink-0">
        <Logo size="sm" to="/dashboard" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3" aria-label="Sections">
        {navGroups.map((group, gi) => (
          <div key={group.header ?? gi} className={cn(gi > 0 && "mt-5")}>
            {group.header && (
              <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text3">
                {group.header}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavRow
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  onNavClick={onNavClick}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="shrink-0 border-t border-border p-3 space-y-1">
        {user?.plan === "free" && (
          <Link
            to="/dashboard/settings#plan"
            onClick={onNavClick}
            className="focus-ring mb-2 flex items-center gap-2.5 rounded-lg border border-brand/25 bg-brand/5 px-3 py-2.5 transition-colors duration-1 ease-out hover:bg-brand/10"
          >
            <div className="rounded-md bg-brand/15 p-1">
              <Zap className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-foreground">
                Upgrade plan
              </p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                More monitors & custom domain
              </p>
            </div>
          </Link>
        )}

        {/* User info */}
        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
            <User className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium leading-none text-foreground">
              {user?.email ?? "—"}
            </p>
            {user?.plan && user.plan !== "free" && (
              <Badge variant="outline" className="mt-1 h-4 px-1 py-0 text-[9px] capitalize">
                {user.plan}
              </Badge>
            )}
          </div>
        </div>

        <SecondaryRow
          to="/dashboard/settings"
          active={isActive("/dashboard/settings")}
          onNavClick={onNavClick}
          icon={Settings}
          label="Settings"
        />

        <button
          type="button"
          onClick={toggle}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="focus-ring group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors duration-1 ease-out hover:bg-accent hover:text-foreground"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 shrink-0 text-text3" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4 shrink-0 text-text3" aria-hidden="true" />
          )}
          <span className="font-mono text-[13px] uppercase tracking-[0.06em]">
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </span>
        </button>

        {/* ⌘K discoverability — nobody tries a shortcut they were never shown */}
        <p className="flex items-center gap-2 px-3 pt-1 text-[11px] text-text3">
          <Command className="h-3 w-3" aria-hidden="true" />
          <span>
            Press{" "}
            <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">
              ⌘K
            </kbd>{" "}
            to search
          </span>
        </p>
      </div>
    </>
  );
}

function SecondaryRow({
  to,
  active,
  onNavClick,
  icon: Icon,
  label,
}: {
  to: string;
  active: boolean;
  onNavClick?: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      to={to}
      onClick={onNavClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring group relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-1 ease-out",
        active
          ? "bg-brand/10 text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full",
          active ? "bg-brand" : "bg-transparent",
        )}
        aria-hidden="true"
      />
      <Icon
        className={cn("h-4 w-4 shrink-0", active ? "text-brand" : "text-text3")}
        aria-hidden="true"
      />
      <span className="font-mono text-[13px] uppercase tracking-[0.06em]">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r border-border bg-card">
      <SidebarContent />
    </aside>
  );
}
