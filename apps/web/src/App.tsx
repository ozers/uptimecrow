import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LandingPage } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { ProtectedRoute } from "./components/protected-route";
import { PublicRoute } from "./components/public-route";
import { DashboardLayout } from "./components/layout/dashboard-layout";
import { Overview } from "./pages/dashboard/Overview";
import { MonitorsList } from "./pages/dashboard/monitors/MonitorsList";
import { MonitorCreate } from "./pages/dashboard/monitors/MonitorCreate";
import { MonitorEdit } from "./pages/dashboard/monitors/MonitorEdit";
import { MonitorDetail } from "./pages/dashboard/monitors/MonitorDetail";
import { IncidentsList } from "./pages/dashboard/incidents/IncidentsList";
import { IncidentCreate } from "./pages/dashboard/incidents/IncidentCreate";
import { IncidentDetail } from "./pages/dashboard/incidents/IncidentDetail";
import { StatusPagesList } from "./pages/dashboard/status-pages/StatusPagesList";
import { StatusPageCreate } from "./pages/dashboard/status-pages/StatusPageCreate";
import { StatusPageEdit } from "./pages/dashboard/status-pages/StatusPageEdit";
import { StatusPageDetail } from "./pages/dashboard/status-pages/StatusPageDetail";
import { Settings } from "./pages/dashboard/Settings";
import { MaintenanceList } from "./pages/dashboard/maintenance/MaintenanceList";
import { Privacy, Terms } from "./pages/Legal";
import { Pricing } from "./pages/Pricing";
import { Docs } from "./pages/Docs";
import SelfHostPage from "./pages/SelfHostPage";
import Changelog from "./pages/Changelog";

// Scroll behaviour on navigation:
//  - `/#features` (from any page) scrolls to that section — React Router does
//    not do this for us, and the old pathname-only effect actively fought it by
//    forcing scrollTo(0,0) on cross-page hash links.
//  - anything else lands at the top.
// Keyed on location.key so clicking the same hash link twice scrolls again.
function ScrollManager() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    // The target may not be laid out yet on a cross-page navigation, so retry
    // for a few frames before giving up and going to the top.
    let frames = 0;
    let raf = 0;
    const seek = () => {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (frames++ < 20) raf = requestAnimationFrame(seek);
      else window.scrollTo(0, 0);
    };
    raf = requestAnimationFrame(seek);
    return () => cancelAnimationFrame(raf);
  }, [pathname, hash, key]);

  return null;
}

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/self-host" element={<SelfHostPage />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Overview />} />
            <Route path="/dashboard/monitors" element={<MonitorsList />} />
            <Route path="/dashboard/monitors/new" element={<MonitorCreate />} />
            <Route path="/dashboard/monitors/:id" element={<MonitorDetail />} />
            <Route path="/dashboard/monitors/:id/edit" element={<MonitorEdit />} />
            <Route path="/dashboard/incidents" element={<IncidentsList />} />
            <Route path="/dashboard/incidents/new" element={<IncidentCreate />} />
            <Route path="/dashboard/incidents/:id" element={<IncidentDetail />} />
            <Route path="/dashboard/status-pages" element={<StatusPagesList />} />
            <Route path="/dashboard/status-pages/new" element={<StatusPageCreate />} />
            <Route path="/dashboard/status-pages/:id" element={<StatusPageDetail />} />
            <Route path="/dashboard/status-pages/:id/edit" element={<StatusPageEdit />} />
            <Route path="/dashboard/maintenance" element={<MaintenanceList />} />
            <Route path="/dashboard/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
