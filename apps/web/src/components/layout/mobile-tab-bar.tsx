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
 * DALGA 2 — Mobil alt sekme çubuğu.
 *
 * Neden: kesinti anında telefonla bakan kullanıcı bugün hamburger → sheet →
 * hedef, yani üç dokunuşla gidiyor. Beş kalıcı hedef bunu tek dokunuşa indirir.
 * Sheet kalıyor ama artık ikincil (Settings, tema, hesap) için.
 *
 * Kurallar:
 *  · Tam olarak beş hedef — altıncısı gelirse sığmaz, sheet'e gider.
 *  · Her hedef min 44px yükseklik + safe-area payı.
 *  · Aktif hedef: brand yeşili ikon + üstte 2px rail (sidebar'daki rail'in
 *    mobil karşılığı, aynı dil).
 *  · İkon + kısa etiket birlikte — ikon tek başına tanınmıyor.
 *  · Down monitör varsa Monitors hedefinde kırmızı nokta göstergesi.
 */
interface TabItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Sağ üstte küçük uyarı noktası (ör. açık kesinti sayısı > 0). */
  alert?: boolean;
}

export interface MobileTabBarProps {
  /** Açık/doğrulanmış kesinti var mı — Incidents hedefine nokta koyar. */
  hasOpenIncident?: boolean;
  /** Down/degraded monitör var mı — Monitors hedefine nokta koyar. */
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
