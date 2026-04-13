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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useAuthStore } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Monitors", href: "/dashboard/monitors", icon: Activity },
  { label: "Incidents", href: "/dashboard/incidents", icon: AlertTriangle },
  { label: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  { label: "Status Pages", href: "/dashboard/status-pages", icon: Globe },
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

  const linkClass = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors border-l-2",
      isActive(href)
        ? "border-primary bg-primary/10 text-primary"
        : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
    );

  return (
    <>
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border px-5 shrink-0">
        <Logo size="sm" to="/dashboard" />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={linkClass(item.href)}
            onClick={onNavClick}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
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
              <p className="text-xs font-semibold text-primary">Upgrade to Pro</p>
              <p className="text-xs text-muted-foreground truncate">Faster intervals + custom domains</p>
            </div>
          </Link>
        )}
        {user?.plan !== "free" && (
          <div className="flex items-center gap-2 px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Plan</span>
            <Badge variant="outline" className="text-xs capitalize">{user?.plan}</Badge>
          </div>
        )}
        <Link
          to="/dashboard/settings"
          className={linkClass("/dashboard/settings")}
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
