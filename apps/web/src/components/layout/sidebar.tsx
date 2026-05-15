import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Globe,
  Settings,
  Zap,
  Wrench,
  Heart,
  Sun,
  Moon,
  User,
  PhoneCall,
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
    label: "Heartbeats",
    href: "/dashboard/heartbeats",
    icon: Heart,
    desc: "Cron job & scheduled task monitoring",
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
  {
    label: "On-Call",
    href: "/dashboard/oncall",
    icon: PhoneCall,
    desc: "Rotation schedule for alerts",
  },
];

interface SidebarContentProps {
  onNavClick?: () => void;
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
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border px-5 shrink-0">
        <Logo size="sm" to="/dashboard" />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors border-l-2",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                item.desc && "py-2.5",
              )}
              onClick={onNavClick}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  item.desc && "mt-0.5",
                )}
              />
              <div className="min-w-0">
                <span className="block leading-none">{item.label}</span>
                {item.desc && (
                  <span
                    className={cn(
                      "mt-0.5 block truncate text-[11px] font-normal leading-none",
                      active
                        ? "text-primary/60"
                        : "text-muted-foreground/60",
                    )}
                  >
                    {item.desc}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="shrink-0 border-t border-border p-3 space-y-1">
        {user?.plan === "free" && (
          <Link
            to="/dashboard/settings"
            onClick={onNavClick}
            className="mb-1 flex items-center gap-2.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5 transition-colors hover:bg-primary/10"
          >
            <div className="rounded-md bg-primary/15 p-1">
              <Zap className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary">
                Upgrade your plan
              </p>
              <p className="text-xs text-muted-foreground truncate">
                More monitors, heartbeats & custom domain
              </p>
            </div>
          </Link>
        )}

        {/* User info */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-md">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium leading-none text-foreground">
              {user?.email ?? "—"}
            </p>
            {user?.plan && user.plan !== "free" && (
              <Badge
                variant="outline"
                className="mt-0.5 h-4 px-1 text-[10px] capitalize"
              >
                {user.plan}
              </Badge>
            )}
          </div>
        </div>

        <Link
          to="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors",
            isActive("/dashboard/settings")
              ? "border-primary bg-primary/10 text-primary"
              : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
          onClick={onNavClick}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>

        <button
          type="button"
          onClick={toggle}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="flex w-full items-center gap-3 rounded-md border-l-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 shrink-0" />
          ) : (
            <Moon className="h-4 w-4 shrink-0" />
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r border-border bg-card">
      <SidebarContent />
    </aside>
  );
}
