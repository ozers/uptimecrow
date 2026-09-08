import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Globe,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The mobile tab bar.
 *
 * Someone checking an outage from a phone had to go hamburger → sheet →
 * destination: three taps to reach anything. Five permanent targets make it
 * one. The sheet stays, demoted to the secondary things (theme, account, plan).
 *
 * Kurallar:
 *  · Exactly five targets. A sixth does not fit and belongs in the sheet.
 *  · Every target is at least 44px tall, plus the safe-area inset.
 *  · The active target gets the brand icon and a 2px rail above it — the
 *    mobile spelling of the sidebar rail, same language.
 *  · Icon and label together: the icon alone is not recognisable enough.
 *  · A red dot marks Monitors when something is down.
 */
interface TabItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Small alert dot in the corner, e.g. when open incidents exist. */
  alert?: boolean;
}

export interface MobileTabBarProps {
  /** Whether an incident is open — dots the Incidents target. */
  hasOpenIncident?: boolean;
  /** Whether a monitor is down or degraded — dots the Monitors target. */
  hasDownMonitor?: boolean;
}

export function MobileTabBar({ hasOpenIncident, hasDownMonitor }: MobileTabBarProps) {
  const location = useLocation();

  const items: TabItem[] = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Pages", href: "/dashboard/status-pages", icon: Globe },
    { label: "Monitors", href: "/dashboard/monitors", icon: Activity, alert: hasDownMonitor },
    { label: "Incidents", href: "/dashboard/incidents", icon: AlertTriangle, alert: hasOpenIncident },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const isActive = (href: string) =>
    href === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(href);

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                to={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-ring relative flex min-h-touch flex-col items-center justify-center gap-1 py-2 transition-colors duration-1 ease-out",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full transition-colors duration-1",
                    active ? "bg-brand" : "bg-transparent",
                  )}
                  aria-hidden="true"
                />
                <span className="relative">
                  <item.icon
                    className={cn("h-5 w-5", active ? "text-brand" : "text-muted-foreground")}
                    aria-hidden="true"
                  />
                  {item.alert && (
                    <span
                      className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-danger ring-2 ring-card"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] leading-none">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
