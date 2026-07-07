import { useNavigate, useLocation, Link } from "react-router-dom";
import { LogOut, ChevronRight, Menu } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Overview",
  monitors: "Monitors",
  incidents: "Incidents",
  "status-pages": "Status Pages",
  settings: "Settings",
  new: "New",
  edit: "Edit",
};

function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean);

  const currentLabel =
    segments.length === 0
      ? "Overview"
      : (ROUTE_LABELS[segments[segments.length - 1]] ?? segments[segments.length - 1]);

  if (segments.length === 0) {
    return (
      <span className="font-mono text-[13px] uppercase tracking-[0.08em] text-foreground">
        Overview
      </span>
    );
  }

  const crumbs = segments
    .map((seg, i) => {
      const path = "/dashboard/" + segments.slice(0, i + 1).join("/");
      const label = ROUTE_LABELS[seg];
      if (!label) return null; // skip IDs
      return { path, label, isLast: i === segments.length - 1 };
    })
    .filter(Boolean) as { path: string; label: string; isLast: boolean }[];

  return (
    <nav aria-label="Breadcrumb">
      {/* Mobile: show only current page */}
      <span className="font-mono text-[13px] uppercase tracking-[0.08em] md:hidden">
        {currentLabel}
      </span>

      {/* Desktop: full chain */}
      <ol className="hidden md:flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.08em]">
        <li>
          <Link to="/dashboard" className="text-muted-foreground hover:text-brand transition-colors">
            Overview
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.path} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
            {crumb.isLast ? (
              <span className="text-foreground">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="text-muted-foreground hover:text-brand transition-colors">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/15 font-mono text-[11px] font-semibold text-brand select-none">
      {initials}
    </span>
  );
}

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/40 px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden h-8 w-8 p-0"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Breadcrumbs />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2 h-9">
            <UserAvatar name={user?.name ?? "U"} />
            <span className="hidden sm:inline text-sm">{user?.name}</span>
            <Badge variant="outline" className="hidden sm:inline-flex capitalize">
              {user?.plan}
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-3 py-2">
            <p className="text-xs font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
