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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useAuthStore } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  desc?: string;
}

const navItems: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
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
  },
  {
    label: "Maintenance",
    href: "/dashboard/maintenance",
    icon: Wrench,
    desc: "Schedule planned downtime",
  },
  {
    label: "Status Pages",
    href: "/dashboard/status-pages",
    icon: Globe,
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
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
        active
          ? "bg-brand/10 text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        item.desc && "py-2.5",
      )}
    >
      {/* Brand-green active accent rail */}
      <span
        className={cn(
          "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full transition-colors",
          active ? "bg-brand" : "bg-transparent",
        )}
      />
      <item.icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-brand" : "text-muted-foreground/70",
          item.desc && "mt-0.5",
        )}
      />
      <div className="min-w-0">
        <span className="block font-mono text-[13px] uppercase tracking-[0.06em] leading-none">
          {item.label}
        </span>
        {item.desc && (
          <span
            className={cn(
              "mt-1 block truncate text-[11px] font-normal leading-none",
              active ? "text-muted-foreground" : "text-muted-foreground/55",
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
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="px-3 pb-2 pt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
          The Watch
        </p>
        {navItems.map((item) => (
          <NavRow
            key={item.href}
            item={item}
            active={isActive(item.href)}
            onNavClick={onNavClick}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="shrink-0 border-t border-border p-3 space-y-1">
        {user?.plan === "free" && (
          <Link
            to="/dashboard/settings#plan"
            onClick={onNavClick}
            className="mb-2 flex items-center gap-2.5 rounded-lg border border-brand/25 bg-brand/5 px-3 py-2.5 transition-colors hover:bg-brand/10"
          >
            <div className="rounded-md bg-brand/15 p-1">
              <Zap className="h-3.5 w-3.5 text-brand" />
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
            <User className="h-3.5 w-3.5 text-muted-foreground" />
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
          className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 shrink-0 text-muted-foreground/70" />
          ) : (
            <Moon className="h-4 w-4 shrink-0 text-muted-foreground/70" />
          )}
          <span className="font-mono text-[13px] uppercase tracking-[0.06em]">
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </span>
        </button>
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
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
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
      />
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-brand" : "text-muted-foreground/70")} />
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
