// Static Generation Service — Pre-render status pages as JSON + HTML
// Renders are stored in Redis (key = uc:sp:<slug>) for multi-container support.
// 7-day TTL; regenerated on every incident/monitor change event.

import { eq, and, desc, sql } from "drizzle-orm";
import { db, redis } from "../db/index.js";
import {
  statusPages,
  monitors,
  statusPageMonitors,
  incidents,
  incidentUpdates,
  checkResults,
  maintenanceWindows,
} from "../db/schema.js";
import { escapeHtml, sanitizeUrl, sanitizeColor } from "../utils/escape.js";
import { renderMarkdown } from "../utils/markdown.js";
import { logger } from "../utils/logger.js";

export interface StaticStatusPage {
  generatedAt: string;
  statusPage: {
    name: string;
    slug: string;
    logoUrl: string | null;
    brandColor: string;
  };
  overallStatus: "operational" | "degraded" | "major_outage";
  monitors: Array<{
    name: string;
    status: string;
    lastCheckedAt: string | null;
    uptimePercent: string | null;
    groupName?: string | null;
    dailyUptime?: Array<{ date: string; percent: number | null; total: number }>;
    recentResponseMs?: number[];
  }>;
  activeIncidents: Array<{
    id: string;
    title: string;
    status: string;
    severity: string;
    startedAt: string;
    updates: Array<{
      status: string;
      body: string;
      createdAt: string;
    }>;
  }>;
  resolvedIncidents?: Array<{
    id: string;
    title: string;
    status: string;
    severity: string;
    startedAt: string;
    resolvedAt: string | null;
    updates: Array<{
      status: string;
      body: string;
      createdAt: string;
    }>;
  }>;
  subscribeEndpoint?: string;
  maintenanceWindows?: Array<{
    id: string;
    title: string;
    body: string | null;
    status: string;
    scheduledStart: string;
    scheduledEnd: string;
    isActive: boolean;
  }>;
}

export async function getRenderedPage(slug: string): Promise<{ json: StaticStatusPage; html: string } | null> {
  try {
    const raw = await redis.get(`uc:sp:${slug}`);
    if (!raw) return null;
    return JSON.parse(raw) as { json: StaticStatusPage; html: string };
  } catch {
    return null;
  }
}

export async function deleteRenderedPage(slug: string): Promise<void> {
  await redis.del(`uc:sp:${slug}`);
}

export async function regenerateStatusPage(
  statusPageId: string,
): Promise<void> {
  const [page] = await db
    .select()
    .from(statusPages)
    .where(eq(statusPages.id, statusPageId))
    .limit(1);

  if (!page) {
    logger.error(`[StaticGen] Status page ${statusPageId} not found`);
    return;
  }

  // Fetch only monitors linked to this status page (in order, with group info)
  const linkedRows = await db
    .select({
      id: monitors.id,
      name: monitors.name,
      status: monitors.status,
      lastCheckedAt: monitors.lastCheckedAt,
      isActive: monitors.isActive,
      groupName: statusPageMonitors.groupName,
    })
    .from(statusPageMonitors)
    .innerJoin(monitors, eq(monitors.id, statusPageMonitors.monitorId))
    .where(and(eq(statusPageMonitors.statusPageId, page.id), eq(monitors.isActive, true)));

  // Calculate per-monitor 30-day uptime
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const monitorsWithUptime = await Promise.all(
    linkedRows.map(async (m) => {
      const stats = await db
        .select({
          total: sql<number>`count(*)`,
          up: sql<number>`count(*) filter (where ${checkResults.status} = 'up')`,
        })
        .from(checkResults)
        .where(
          and(
            eq(checkResults.monitorId, m.id),
            sql`${checkResults.checkedAt} > ${thirtyDaysAgo.toISOString()}`,
          ),
        );

      const total = Number(stats[0]?.total || 0);
      const up = Number(stats[0]?.up || 0);

      return {
        name: m.name,
        status: m.status,
        lastCheckedAt: m.lastCheckedAt?.toISOString() ?? null,
        uptimePercent: total > 0 ? ((up / total) * 100).toFixed(2) : null,
        groupName: m.groupName ?? null,
      };
    }),
  );

  // Use linked monitors for status calculation
  const orgMonitors = linkedRows;

  // Fetch active incidents with updates
  const activeIncidents = await db
    .select()
    .from(incidents)
    .where(
      and(
        eq(incidents.statusPageId, page.id),
        sql`${incidents.status} != 'resolved'`,
      ),
    )
    .orderBy(desc(incidents.startedAt));

  const incidentsWithUpdates = await Promise.all(
    activeIncidents.map(async (incident) => {
      const updates = await db
        .select({
          status: incidentUpdates.status,
          body: incidentUpdates.body,
          createdAt: incidentUpdates.createdAt,
        })
        .from(incidentUpdates)
        .where(eq(incidentUpdates.incidentId, incident.id))
        .orderBy(desc(incidentUpdates.createdAt));

      return {
        id: incident.id,
        title: incident.title,
        status: incident.status,
        severity: incident.severity,
        startedAt: incident.startedAt.toISOString(),
        updates: updates.map((u) => ({
          status: u.status,
          body: u.body,
          createdAt: u.createdAt.toISOString(),
        })),
      };
    }),
  );

  // Active + upcoming maintenance windows (next 7 days)
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const maintenanceRows = await db
    .select()
    .from(maintenanceWindows)
    .where(
      and(
        eq(maintenanceWindows.statusPageId, page.id),
        sql`${maintenanceWindows.status} IN ('scheduled', 'in_progress')`,
        sql`${maintenanceWindows.scheduledEnd} > ${now.toISOString()}`,
        sql`${maintenanceWindows.scheduledStart} < ${weekAhead.toISOString()}`,
      ),
    )
    .orderBy(maintenanceWindows.scheduledStart);

  const maintenanceForRender = maintenanceRows.map((m) => ({
    id: m.id,
    title: m.title,
    body: m.body,
    status: m.status,
    scheduledStart: m.scheduledStart.toISOString(),
    scheduledEnd: m.scheduledEnd.toISOString(),
    isActive: m.scheduledStart <= now && m.scheduledEnd >= now,
  }));
  const anyMaintenanceActive = maintenanceForRender.some((m) => m.isActive);

  // Determine overall status — active maintenance downgrades outages to "degraded"
  // since the operator has declared the disruption expected.
  const hasDown = orgMonitors.some((m) => m.status === "down");
  const hasDegraded = orgMonitors.some((m) => m.status === "degraded");
  let overallStatus: "operational" | "degraded" | "major_outage";
  if (hasDown && !anyMaintenanceActive) overallStatus = "major_outage";
  else if (hasDown || hasDegraded || anyMaintenanceActive) overallStatus = "degraded";
  else overallStatus = "operational";

  const jsonData: StaticStatusPage = {
    generatedAt: new Date().toISOString(),
    statusPage: {
      name: page.name,
      slug: page.slug,
      logoUrl: page.logoUrl,
      brandColor: page.brandColor,
    },
    overallStatus,
    monitors: monitorsWithUptime,
    activeIncidents: incidentsWithUpdates,
    maintenanceWindows: maintenanceForRender,
  };

  const html = renderStatusHtml(jsonData);

  await redis.set(`uc:sp:${page.slug}`, JSON.stringify({ json: jsonData, html }), "EX", 604800); // 7-day TTL
  logger.info(`[StaticGen] Regenerated status page: ${page.slug}`);
}

// slug is validated at create time (regex /^[a-z0-9-]+$/) but we escape here
// too — cheap insurance if that invariant ever weakens.
function escapeAttrValue(input: string): string {
  return input.replace(/[^a-z0-9-]/gi, "");
}

export function renderStatusHtml(data: StaticStatusPage): string {
  const brand = sanitizeColor(data.statusPage.brandColor);
  const pageName = escapeHtml(data.statusPage.name);
  const logoUrl = sanitizeUrl(data.statusPage.logoUrl);

  const statusColor =
    data.overallStatus === "operational" ? "#22c55e"
      : data.overallStatus === "degraded" ? "#f59e0b"
      : "#ef4444";
  const statusLabel =
    data.overallStatus === "operational" ? "All Systems Operational"
      : data.overallStatus === "degraded" ? "Degraded Performance"
      : "Major Outage";
  const statusBg =
    data.overallStatus === "operational" ? "rgba(34,197,94,0.08)"
      : data.overallStatus === "degraded" ? "rgba(245,158,11,0.08)"
      : "rgba(239,68,68,0.08)";
  const statusBorder =
    data.overallStatus === "operational" ? "rgba(34,197,94,0.2)"
      : data.overallStatus === "degraded" ? "rgba(245,158,11,0.2)"
      : "rgba(239,68,68,0.2)";

  function dotColor(status: string) {
    return status === "up" ? "#22c55e"
      : status === "down" ? "#ef4444"
      : status === "degraded" ? "#f59e0b"
      : "#6b7280";
  }
  function statusText(status: string) {
    return status === "up" ? "Operational"
      : status === "down" ? "Outage"
      : status === "degraded" ? "Degraded"
      : "Unknown";
  }
  function incidentStatusColor(s: string) {
    return s === "investigating" ? "#ef4444"
      : s === "identified" ? "#f59e0b"
      : s === "monitoring" ? "#3b82f6"
      : "#22c55e";
  }
  function incidentStatusLabel(s: string) {
    return s === "investigating" ? "Investigating"
      : s === "identified" ? "Identified"
      : s === "monitoring" ? "Monitoring"
      : "Resolved";
  }
  function severityColor(sev: string) {
    return sev === "critical" ? "#ef4444"
      : sev === "major" ? "#f59e0b"
      : "#eab308";
  }
  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }
  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }
  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  }

  function renderUptimeBar(daily: Array<{ date: string; percent: number | null; total: number }>) {
    if (!daily || daily.length === 0) return '';
    const bars = daily.map((d) => {
      let fill: string;
      let title: string;
      if (d.total === 0) {
        fill = "var(--bar-empty)";
        title = `${d.date}: No data`;
      } else if (d.percent !== null && d.percent >= 99.5) {
        fill = "#22c55e";
        title = `${d.date}: ${d.percent.toFixed(1)}% uptime`;
      } else if (d.percent !== null && d.percent >= 95) {
        fill = "#f59e0b";
        title = `${d.date}: ${d.percent.toFixed(1)}% uptime`;
      } else {
        fill = "#ef4444";
        title = `${d.date}: ${d.percent?.toFixed(1) ?? 0}% uptime`;
      }
      return `<div class="ubar" style="background:${fill}" title="${escapeHtml(title)}"></div>`;
    }).join("");
    const dayCount = daily.length;
    return `<div class="ubar-wrap">
  <div class="ubar-track">${bars}</div>
  <div class="ubar-labels">
    <span>${dayCount} days ago</span>
    <span>Today</span>
  </div>
</div>`;
  }

  function renderMonitorRow(m: typeof data.monitors[number]) {
    const dc = dotColor(m.status);
    const st = statusText(m.status);
    const uptimePct = m.uptimePercent ? parseFloat(m.uptimePercent) : null;
    const uptimeColor = uptimePct === null ? "var(--text3)"
      : uptimePct >= 99.9 ? "#22c55e"
      : uptimePct >= 99 ? "#f59e0b"
      : "#ef4444";
    const bar = renderUptimeBar(m.dailyUptime ?? []);
    return `<div class="service-row">
  <div class="service-top">
    <div class="service-name-wrap">
      <span class="service-dot" style="background:${dc};box-shadow:0 0 0 3px ${dc}20"></span>
      <span class="service-name">${escapeHtml(m.name)}</span>
    </div>
    <div class="service-meta">
      <span class="service-status" style="color:${dc};background:${dc}15">${st}</span>
      ${uptimePct !== null ? `<span class="service-uptime" style="color:${uptimeColor}">${m.uptimePercent}%</span>` : ""}
    </div>
  </div>
  ${bar}
</div>`;
  }

  // Monitors section — render grouped or flat
  let monitorsHtml: string;
  if (data.monitors.length === 0) {
    monitorsHtml = '<p style="font-size:13px;color:var(--text3);padding:16px 0">No services configured.</p>';
  } else {
    const hasGroups = data.monitors.some((m) => m.groupName);
    if (!hasGroups) {
      monitorsHtml = data.monitors.map(renderMonitorRow).join("");
    } else {
      // Group monitors: null group goes last as "Other"
      const groups = new Map<string, typeof data.monitors>();
      for (const m of data.monitors) {
        const key = m.groupName || "";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(m);
      }
      // Sort: named groups first, then ungrouped
      const sortedGroups = [...groups.entries()].sort(([a], [b]) => {
        if (!a && b) return 1;
        if (a && !b) return -1;
        return a.localeCompare(b);
      });
      monitorsHtml = sortedGroups.map(([groupName, groupMonitors]) => {
        const label = groupName ? escapeHtml(groupName) : "Other";
        return `<div class="service-group">
  <div class="service-group-label">${label}</div>
  ${groupMonitors.map(renderMonitorRow).join("")}
</div>`;
      }).join("");
    }
  }

  // Incident rendering
  function renderIncidentUpdates(updates: Array<{ status: string; body: string; createdAt: string }>) {
    if (updates.length === 0) return '';
    return `<div class="updates">${updates.map((u, i) => {
      const uc = incidentStatusColor(u.status);
      const ul = incidentStatusLabel(u.status);
      return `<div class="update-row">
    <div class="update-timeline">
      <div class="update-dot" style="background:${uc}"></div>
      ${i < updates.length - 1 ? '<div class="update-line"></div>' : ''}
    </div>
    <div class="update-body">
      <div class="update-header">
        <span class="update-status" style="color:${uc}">${ul}</span>
        <span class="update-time">${formatDateTime(u.createdAt)}</span>
      </div>
      <div class="md">${renderMarkdown(u.body)}</div>
    </div>
  </div>`;
    }).join("")}</div>`;
  }

  function renderIncident(inc: {
    title: string; status: string; severity: string; startedAt: string;
    resolvedAt?: string | null;
    updates: Array<{ status: string; body: string; createdAt: string }>;
  }, isResolved = false) {
    const sc = incidentStatusColor(inc.status);
    const sl = incidentStatusLabel(inc.status);
    const sevColor = severityColor(inc.severity);
    return `<div class="incident-card">
  <div class="incident-header">
    <div class="incident-title-row">
      <span class="incident-sev" style="background:${sevColor}18;color:${sevColor}">${inc.severity.toUpperCase()}</span>
      <span class="incident-status-badge" style="background:${sc}18;color:${sc}">${sl}</span>
    </div>
    <h3 class="incident-title">${escapeHtml(inc.title)}</h3>
    <div class="incident-time">
      ${isResolved && inc.resolvedAt
        ? `Started ${formatDate(inc.startedAt)} &mdash; <span style="color:#22c55e">Resolved ${timeAgo(inc.resolvedAt)}</span>`
        : `Started ${timeAgo(inc.startedAt)}`}
    </div>
  </div>
  ${renderIncidentUpdates(inc.updates)}
</div>`;
  }

  // Maintenance rendering
  function renderMaintenance(m: NonNullable<StaticStatusPage["maintenanceWindows"]>[number]) {
    const color = m.isActive ? "#3b82f6" : "#8b5cf6";
    const label = m.isActive ? "In Progress" : "Scheduled";
    const start = formatDate(m.scheduledStart);
    const end = formatDate(m.scheduledEnd);
    return `<div class="incident-card" style="border-left-color:${color}">
  <div class="incident-header">
    <div class="incident-title-row">
      <span class="incident-sev" style="background:${color}18;color:${color}">MAINTENANCE</span>
      <span class="incident-status-badge" style="background:${color}18;color:${color}">${label}</span>
    </div>
    <h3 class="incident-title">${escapeHtml(m.title)}</h3>
    <div class="incident-time">${start} &rarr; ${end}</div>
  </div>
  ${m.body ? `<div class="md" style="margin-top:12px;font-size:13px;color:var(--text2)">${renderMarkdown(m.body)}</div>` : ''}
</div>`;
  }

  const activeIncidentsSection = data.activeIncidents.length > 0
    ? `<section class="section">
  <div class="section-header">
    <span class="section-dot" style="background:#ef4444"></span>
    <span>Active Incidents</span>
    <span class="section-badge" style="background:#ef444420;color:#ef4444">${data.activeIncidents.length}</span>
  </div>
  ${data.activeIncidents.map((inc) => renderIncident(inc)).join("")}
</section>`
    : '';

  const maintenanceSection = (data.maintenanceWindows && data.maintenanceWindows.length > 0)
    ? `<section class="section">
  <div class="section-header">
    <span class="section-dot" style="background:#3b82f6"></span>
    <span>Scheduled Maintenance</span>
  </div>
  ${data.maintenanceWindows.map(renderMaintenance).join("")}
</section>`
    : '';

  const resolvedSection = data.resolvedIncidents && data.resolvedIncidents.length > 0
    ? `<section class="section">
  <div class="section-header">
    <span class="section-dot" style="background:var(--text3)"></span>
    <span>Incident History</span>
  </div>
  ${data.resolvedIncidents.map((inc) => renderIncident(inc, true)).join("")}
</section>`
    : `<section class="section">
  <div class="section-header">
    <span class="section-dot" style="background:var(--text3)"></span>
    <span>Incident History</span>
  </div>
  <div class="empty-state">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text3);margin-bottom:8px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    <p>No incidents recorded in the past 90 days.</p>
  </div>
</section>`;

  const subscribeSection = data.subscribeEndpoint
    ? `<section class="subscribe-section">
  <div class="subscribe-inner">
    <div class="subscribe-text">
      <div class="subscribe-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      </div>
      <div>
        <p class="subscribe-title">Get incident updates</p>
        <p class="subscribe-desc">We&apos;ll email you when incidents start and resolve.</p>
      </div>
    </div>
    <form id="subscribe-form" class="subscribe-form">
      <input type="email" id="sub-email" class="sub-input" placeholder="you@company.com" required autocomplete="email" />
      <button type="submit" class="sub-btn" style="background:${brand}">Subscribe</button>
    </form>
    <p id="subscribe-msg" class="subscribe-msg"></p>
  </div>
</section>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${pageName} &mdash; Status</title>
  <link rel="alternate" type="application/rss+xml" title="${pageName} incidents" href="/status/${escapeAttrValue(data.statusPage.slug)}/rss">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{
      --bg:#08080d;--surface:#0f0f16;--card:#13131c;--border:#1c1c28;--border2:#252535;
      --text:#ededf5;--text2:#8888a0;--text3:#505068;
      --bar-empty:#1c1c28;
      --brand:${brand};
      --radius:12px;
    }
    [data-theme="light"]{
      --bg:#f4f4f8;--surface:#fff;--card:#fff;--border:#e2e2ee;--border2:#d0d0e0;
      --text:#0d0d1a;--text2:#5a5a78;--text3:#9090b0;
      --bar-empty:#e2e2ee;
    }
    html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;scroll-behavior:smooth}
    body{background:var(--bg);color:var(--text);font-family:'Inter',system-ui,sans-serif;line-height:1.5;min-height:100vh}

    /* ── Status accent bar ── */
    .accent-bar{height:3px;background:${statusColor};position:sticky;top:0;z-index:100}

    /* ── Wrap ── */
    .wrap{max-width:740px;margin:0 auto;padding:0 20px 80px}

    /* ── Navbar ── */
    .navbar{display:flex;align-items:center;justify-content:space-between;padding:20px 0 28px}
    .nav-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--text)}
    .nav-logo{height:28px;border-radius:6px;flex-shrink:0}
    .nav-name{font-size:15px;font-weight:700;letter-spacing:-0.02em;color:var(--text)}
    .nav-right{display:flex;align-items:center;gap:10px}
    .live-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;border:1px solid var(--border2);font-size:11px;font-weight:500;color:var(--text3)}
    .live-dot{width:6px;height:6px;border-radius:50%;background:#22c55e;animation:pulse-dot 2.4s ease-in-out infinite;flex-shrink:0}
    @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}
    .theme-btn{background:var(--surface);border:1px solid var(--border2);border-radius:8px;color:var(--text2);cursor:pointer;padding:6px 12px;font-size:12px;font-weight:500;font-family:inherit;transition:border-color .15s,color .15s;line-height:1;display:flex;align-items:center;gap:5px}
    .theme-btn:hover{border-color:var(--text3);color:var(--text)}

    /* ── Status Hero ── */
    .status-hero{
      padding:32px 28px;
      border-radius:var(--radius);
      border:1px solid ${statusBorder};
      background:${statusBg};
      margin-bottom:36px;
      position:relative;
      overflow:hidden;
      display:flex;
      align-items:center;
      gap:20px;
    }
    .status-hero::before{
      content:'';position:absolute;inset:0;
      background:radial-gradient(ellipse at 0% 50%, ${statusColor}0a 0%, transparent 60%);
      pointer-events:none;
    }
    .status-icon{
      width:52px;height:52px;flex-shrink:0;
      border-radius:14px;
      background:${statusColor}18;
      border:1px solid ${statusColor}30;
      display:flex;align-items:center;justify-content:center;
    }
    .status-icon svg{color:${statusColor}}
    .status-text{flex:1;min-width:0}
    .status-label{font-size:20px;font-weight:700;letter-spacing:-0.03em;color:${statusColor};line-height:1.2}
    .status-sub{font-size:12px;color:var(--text3);margin-top:4px;display:flex;align-items:center;gap:6px}
    .status-sub-dot{width:5px;height:5px;border-radius:50%;background:var(--text3);flex-shrink:0}
    .status-refresh{
      display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;
    }
    .status-refresh-label{font-size:11px;color:var(--text3);text-align:right}
    .status-refresh-btn{
      display:flex;align-items:center;gap:4px;font-size:11px;font-weight:500;
      color:var(--text3);background:transparent;border:1px solid var(--border2);
      border-radius:6px;padding:4px 8px;cursor:pointer;font-family:inherit;
      transition:border-color .15s,color .15s;
    }
    .status-refresh-btn:hover{border-color:var(--text2);color:var(--text2)}

    /* ── Section ── */
    .section{margin-top:40px}
    .section-header{
      display:flex;align-items:center;gap:8px;
      margin-bottom:16px;
      font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);
    }
    .section-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
    .section-badge{padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700}

    /* ── Service Groups ── */
    .service-group{margin-bottom:20px}
    .service-group-label{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);padding:0 2px 8px;border-bottom:1px solid var(--border);margin-bottom:8px}

    /* ── Service Row ── */
    .service-row{
      background:var(--card);border:1px solid var(--border);border-radius:var(--radius);
      padding:16px 18px;margin-bottom:8px;transition:border-color .15s;
    }
    .service-row:hover{border-color:var(--border2)}
    .service-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
    .service-name-wrap{display:flex;align-items:center;gap:10px;min-width:0}
    .service-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
    .service-name{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .service-meta{display:flex;align-items:center;gap:10px;flex-shrink:0}
    .service-status{font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px;white-space:nowrap}
    .service-uptime{font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;min-width:52px;text-align:right}

    /* Uptime bar */
    .ubar-wrap{margin-top:4px}
    .ubar-track{display:flex;gap:2px;height:20px;border-radius:4px;overflow:hidden}
    .ubar{flex:1;cursor:default;transition:opacity .15s}
    .ubar:hover{opacity:.8}
    .ubar-labels{display:flex;justify-content:space-between;margin-top:5px;font-size:10px;color:var(--text3)}

    /* ── Incident Card ── */
    .incident-card{
      background:var(--card);border:1px solid var(--border);border-left:3px solid var(--brand);
      border-radius:var(--radius);padding:18px 20px;margin-bottom:10px;
    }
    .incident-header{margin-bottom:12px}
    .incident-title-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}
    .incident-sev{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:2px 8px;border-radius:4px}
    .incident-status-badge{font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px}
    .incident-title{font-size:15px;font-weight:600;letter-spacing:-.01em;margin-bottom:4px}
    .incident-time{font-size:12px;color:var(--text3)}

    /* Updates timeline */
    .updates{margin-top:16px;padding-top:16px;border-top:1px solid var(--border)}
    .update-row{display:flex;gap:14px;padding-bottom:16px}
    .update-row:last-child{padding-bottom:0}
    .update-timeline{display:flex;flex-direction:column;align-items:center;flex-shrink:0;padding-top:3px}
    .update-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
    .update-line{width:1px;flex:1;background:var(--border);margin-top:5px}
    .update-body{flex:1;min-width:0}
    .update-header{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}
    .update-status{font-size:11px;font-weight:700;text-transform:capitalize}
    .update-time{font-size:11px;color:var(--text3)}

    /* Markdown */
    .md{font-size:13px;color:var(--text2);line-height:1.65}
    .md p{margin:0 0 8px 0}.md p:last-child{margin-bottom:0}
    .md ul,.md ol{margin:6px 0 8px 20px}
    .md li{margin:2px 0}
    .md code{background:var(--border);padding:2px 6px;border-radius:4px;font-family:ui-monospace,Menlo,monospace;font-size:12px}
    .md a{color:var(--brand);text-decoration:underline}
    .md strong{color:var(--text)}

    /* ── Subscribe ── */
    .subscribe-section{margin-top:48px}
    .subscribe-inner{
      background:var(--card);border:1px solid var(--border);border-radius:var(--radius);
      padding:24px 24px 20px;
    }
    .subscribe-text{display:flex;align-items:flex-start;gap:14px;margin-bottom:18px}
    .subscribe-icon{
      width:38px;height:38px;flex-shrink:0;
      border-radius:10px;background:var(--brand)18;border:1px solid var(--brand)30;
      display:flex;align-items:center;justify-content:center;
    }
    .subscribe-icon svg{color:var(--brand);flex-shrink:0}
    .subscribe-title{font-size:14px;font-weight:600;margin-bottom:3px}
    .subscribe-desc{font-size:12px;color:var(--text2)}
    .subscribe-form{display:flex;gap:8px;max-width:480px}
    .sub-input{flex:1;padding:10px 14px;border:1px solid var(--border2);border-radius:8px;background:var(--surface);color:var(--text);font-size:13px;font-family:inherit;outline:none;transition:border-color .15s;min-width:0}
    .sub-input:focus{border-color:var(--brand)}
    .sub-input::placeholder{color:var(--text3)}
    .sub-btn{padding:10px 20px;border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;opacity:.92;transition:opacity .15s,transform .15s;white-space:nowrap;flex-shrink:0}
    .sub-btn:hover{opacity:1;transform:translateY(-1px)}
    .subscribe-msg{font-size:12px;margin-top:10px;min-height:18px}

    /* Empty state */
    .empty-state{display:flex;flex-direction:column;align-items:center;padding:32px 0;font-size:13px;color:var(--text3);text-align:center}

    /* ── Footer ── */
    .page-footer{margin-top:56px;padding-top:20px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--text3);flex-wrap:wrap;gap:8px}
    .page-footer a{color:var(--text3);text-decoration:none;transition:color .15s}
    .page-footer a:hover{color:var(--text2)}
    .footer-powered{display:flex;align-items:center;gap:4px}

    @media(max-width:600px){
      .wrap{padding:0 16px 60px}
      .status-hero{flex-direction:column;align-items:flex-start;gap:14px}
      .status-refresh{align-items:flex-start}
      .service-top{flex-wrap:wrap}
      .subscribe-form{flex-direction:column}
      .page-footer{flex-direction:column;text-align:center;justify-content:center}
      .navbar{padding:16px 0 20px}
    }
  </style>
</head>
<body>
  <div class="accent-bar"></div>
  <div class="wrap">

    <!-- Navbar -->
    <nav class="navbar">
      <div class="nav-brand">
        ${logoUrl ? `<img src="${logoUrl}" alt="${pageName}" class="nav-logo">` : ''}
        <span class="nav-name">${pageName}</span>
      </div>
      <div class="nav-right">
        <span class="live-pill">
          <span class="live-dot"></span>
          <span id="refresh-label">Live</span>
        </span>
        <button class="theme-btn" onclick="toggleTheme()" id="theme-btn" aria-label="Toggle color theme">
          <svg id="theme-icon-moon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg id="theme-icon-sun" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <span id="theme-label">Light</span>
        </button>
      </div>
    </nav>

    <!-- Status Hero -->
    <div class="status-hero">
      <div class="status-icon">
        ${data.overallStatus === "operational"
          ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
          : data.overallStatus === "degraded"
          ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
          : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
        }
      </div>
      <div class="status-text">
        <div class="status-label">${statusLabel}</div>
        <div class="status-sub">
          <span class="status-sub-dot"></span>
          <span id="last-updated">Updated just now</span>
          <span class="status-sub-dot"></span>
          <span>${data.monitors.length} service${data.monitors.length !== 1 ? "s" : ""} monitored</span>
        </div>
      </div>
      <div class="status-refresh">
        <span class="status-refresh-label">Auto-refreshes in <span id="countdown">60</span>s</span>
        <button class="status-refresh-btn" onclick="location.reload()">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Services -->
    <section>
      <div class="section-header">
        <span class="section-dot" style="background:${statusColor}"></span>
        <span>Services</span>
      </div>
      ${monitorsHtml}
    </section>

    ${maintenanceSection}
    ${activeIncidentsSection}
    ${resolvedSection}
    ${subscribeSection}

    <!-- Footer -->
    <footer class="page-footer">
      <span>&copy; ${new Date().getFullYear()} ${pageName}</span>
      <div style="display:flex;align-items:center;gap:16px">
        <a href="/status/${escapeAttrValue(data.statusPage.slug)}/rss" title="RSS Feed" style="display:inline-flex;align-items:center;gap:4px;color:var(--text3);text-decoration:none;font-size:12px" target="_blank" rel="noopener noreferrer">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/></svg>
          RSS
        </a>
        <span class="footer-powered">
          Powered by
          <a href="https://uptimecrow.com" target="_blank" rel="noopener noreferrer" style="color:var(--brand);margin-left:4px">UptimeCrow</a>
        </span>
      </div>
    </footer>

  </div>

  <script>
  (function(){
    // Theme
    var stored = localStorage.getItem('uc-sp-theme');
    var sysDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
    var current = stored || (sysDark ? 'dark' : 'light');
    applyTheme(current);

    function applyTheme(t) {
      document.documentElement.setAttribute('data-theme', t);
      var moon = document.getElementById('theme-icon-moon');
      var sun = document.getElementById('theme-icon-sun');
      var lbl = document.getElementById('theme-label');
      if (moon) moon.style.display = t === 'dark' ? 'block' : 'none';
      if (sun) sun.style.display = t === 'light' ? 'block' : 'none';
      if (lbl) lbl.textContent = t === 'dark' ? 'Light' : 'Dark';
    }
    window.toggleTheme = function() {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem('uc-sp-theme', next);
      applyTheme(next);
    };

    // Countdown + last updated
    var genAt = new Date('${data.generatedAt}').getTime();
    var countdownEl = document.getElementById('countdown');
    var updatedEl = document.getElementById('last-updated');
    var secs = 60;

    function tick() {
      secs--;
      if (countdownEl) countdownEl.textContent = String(secs);
      var age = Math.floor((Date.now() - genAt) / 1000);
      var label = age < 10 ? 'just now' : age < 60 ? age + 's ago' : Math.floor(age/60) + 'm ago';
      if (updatedEl) updatedEl.textContent = 'Updated ' + label;
      if (secs <= 0) location.reload();
    }
    setInterval(tick, 1000);
  })();

  ${data.subscribeEndpoint ? `
  (function(){
    var form = document.getElementById('subscribe-form');
    var msg = document.getElementById('subscribe-msg');
    if (!form) return;
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = form.querySelector('.sub-btn');
      var email = document.getElementById('sub-email').value;
      if (btn) { btn.disabled = true; btn.textContent = 'Subscribing…'; }
      if (msg) { msg.textContent = ''; }
      fetch('${data.subscribeEndpoint}', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: email})
      })
        .then(function(r) { return r.json().then(function(d) { return {ok: r.ok, d: d}; }); })
        .then(function(r) {
          if (msg) {
            msg.textContent = r.d.message || (r.ok ? 'Subscribed!' : 'Something went wrong.');
            msg.style.color = r.ok ? '#22c55e' : '#ef4444';
          }
          if (r.ok) { form.reset(); }
          if (btn) { btn.disabled = false; btn.textContent = 'Subscribe'; }
        })
        .catch(function() {
          if (msg) { msg.textContent = 'Something went wrong. Try again.'; msg.style.color = '#ef4444'; }
          if (btn) { btn.disabled = false; btn.textContent = 'Subscribe'; }
        });
    });
  })();` : ''}
  </script>
</body>
</html>`;
}
