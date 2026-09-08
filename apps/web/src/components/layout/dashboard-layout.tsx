import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar, SidebarContent } from "./sidebar";
import { Header } from "./header";
import { MobileTabBar } from "./mobile-tab-bar";
import { SetupChecklist } from "@/components/setup-checklist";
import { CommandPalette } from "@/components/command-palette";
import { useMonitors } from "@/lib/queries/monitors";
import { useIncidents } from "@/lib/queries/incidents";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

/**
 * Layout changes:
 * · MobileTabBar adds five permanent targets on mobile. The sheet stays, but
 *   demoted to the rare things: theme, account, plan.
 * · <main> reserves the height of that bar (pb-tabbar) so nothing is covered.
 * · CommandPalette is mounted globally, so ⌘K / Ctrl+K works everywhere.
 * · The tab bar's alert dots read monitor and incident data here; both queries
 *   are already cached, so this costs no extra request.
 */
export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: monitors } = useMonitors();
  const { data: incidents } = useIncidents();

  const hasDownMonitor = !!monitors?.some(
    (m) => m.status === "down" || m.status === "degraded",
  );
  const hasOpenIncident = !!incidents?.some((i) => i.status !== "resolved");

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar Sheet — ikincil navigasyon */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 w-64 border-r bg-card flex flex-col [&>button]:hidden"
        >
          <SidebarContent onNavClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <SetupChecklist />
        <main className="flex-1 overflow-y-auto p-4 pb-tabbar md:p-8 md:pb-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileTabBar hasDownMonitor={hasDownMonitor} hasOpenIncident={hasOpenIncident} />
      <CommandPalette />
    </div>
  );
}
