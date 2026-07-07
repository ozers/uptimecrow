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
import { HeartbeatsList } from "./pages/dashboard/heartbeats/HeartbeatsList";
import { Privacy, Terms } from "./pages/Legal";
import { Pricing } from "./pages/Pricing";
import { Docs } from "./pages/Docs";
import { AcceptInvite } from "./pages/AcceptInvite";
import { VsBetterStack } from "./pages/compare/VsBetterStack";
import { VsUptimeRobot } from "./pages/compare/VsUptimeRobot";
import { VsFreshping } from "./pages/compare/VsFreshping";
import { VsUptimeKuma } from "./pages/compare/VsUptimeKuma";
import { VsInstatus } from "./pages/compare/VsInstatus";
import { VsPingdom } from "./pages/compare/VsPingdom";
import { VsCronitor } from "./pages/compare/VsCronitor";
import { VsHealthchecks } from "./pages/compare/VsHealthchecks";
import { VsStatusCake } from "./pages/compare/VsStatusCake";
import McpPage from "./pages/McpPage";
import SelfHostPage from "./pages/SelfHostPage";
import HeartbeatPage from "./pages/HeartbeatPage";
import { FreshpingAlternative } from "./pages/FreshpingAlternative";
import ToolsIndex from "./pages/tools/ToolsIndex";
import SslChecker from "./pages/tools/SslChecker";
import DnsLookup from "./pages/tools/DnsLookup";
import UptimeTest from "./pages/tools/UptimeTest";
import Changelog from "./pages/Changelog";

// Reset scroll to the top on every route change (e.g. clicking the logo from a
// scrolled-down page lands you at the top, not mid-page).
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/vs/betterstack" element={<VsBetterStack />} />
        <Route path="/vs/uptimerobot" element={<VsUptimeRobot />} />
        <Route path="/vs/freshping" element={<VsFreshping />} />
        <Route path="/vs/uptime-kuma" element={<VsUptimeKuma />} />
        <Route path="/vs/instatus" element={<VsInstatus />} />
        <Route path="/vs/pingdom" element={<VsPingdom />} />
        <Route path="/vs/cronitor" element={<VsCronitor />} />
        <Route path="/vs/healthchecks" element={<VsHealthchecks />} />
        <Route path="/vs/statuscake" element={<VsStatusCake />} />
        <Route path="/mcp" element={<McpPage />} />
        <Route path="/self-host" element={<SelfHostPage />} />
        <Route path="/heartbeat-monitoring" element={<HeartbeatPage />} />
        <Route path="/freshping-alternative" element={<FreshpingAlternative />} />
        <Route path="/tools" element={<ToolsIndex />} />
        <Route path="/tools/ssl-checker" element={<SslChecker />} />
        <Route path="/tools/dns-lookup" element={<DnsLookup />} />
        <Route path="/tools/uptime-test" element={<UptimeTest />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route path="/invite/:token" element={<AcceptInvite />} />
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
            <Route path="/dashboard/heartbeats" element={<HeartbeatsList />} />
            <Route path="/dashboard/maintenance" element={<MaintenanceList />} />
            <Route path="/dashboard/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
