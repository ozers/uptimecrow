import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar, SidebarContent } from "./sidebar";
import { Header } from "./header";
import { SetupChecklist } from "@/components/setup-checklist";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar Sheet */}
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
