// Static Generation Service — Pre-render status pages as JSON + HTML
// Renders are stored in-memory (Map) and served by a dedicated route.
// Can be swapped to Cloudflare R2 / S3 in production.

import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
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

type StatusPageRow = typeof statusPages.$inferSelect;

// In-memory store for rendered pages. Key = slug.
const pageStore = new Map<string, { json: StaticStatusPage; html: string }>();

export function getRenderedPage(slug: string) {
  return pageStore.get(slug) ?? null;
}

async function fetchIncidentUpdates(incidentId: string) {
  const updates = await db
    .select({
      status: incidentUpdates.status,
      body: incidentUpdates.body,
      createdAt: incidentUpdates.createdAt,
    })
    .from(incidentUpdates)
    .where(eq(incidentUpdates.incidentId, incidentId))
    .orderBy(desc(incidentUpdates.createdAt));
  return updates.map((u) => ({
    status: u.status,
    body: u.body,
    createdAt: u.createdAt.toISOString(),
  }));
}

// Single source of truth for status page data. Used by both the pre-render
// path (worker generate.job) and the dynamic fallback route (public.ts), so
// the static page is never a poorer version of the live one.
export async function buildStatusPageData(page: StatusPageRow): Promise<StaticStatusPage> {
  // Monitors linked to this page (with group info); fall back to all org
  // monitors when none are explicitly linked.
  const linkedRows = await db
    .select({
      id: monitors.id,
      name: monitors.name,
      status: monitors.status,
      lastCheckedAt: monitors.lastCheckedAt,
      groupName: statusPageMonitors.groupName,
    })
    .from(statusPageMonitors)
    .innerJoin(monitors, eq(monitors.id, statusPageMonitors.monitorId))
    .where(and(eq(statusPageMonitors.statusPageId, page.id), eq(monitors.isActive, true)));

  let monitorRows: Array<{
    id: string;
    name: string;
    status: string;
    lastCheckedAt: Date | null;
    groupName: string | null;
  }>;
  if (linkedRows.length > 0) {
    monitorRows = linkedRows.map((m) => ({ ...m, groupName: m.groupName ?? null }));
  } else {
    const orgRows = await db
      .select({
        id: monitors.id,
        name: monitors.name,
        status: monitors.status,
        lastCheckedAt: monitors.lastCheckedAt,
      })
      .from(monitors)
      .where(and(eq(monitors.orgId, page.orgId), eq(monitors.isActive, true)));
    monitorRows = orgRows.map((m) => ({ ...m, groupName: null }));
  }

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const monitorsWithUptime = await Promise.all(
    monitorRows.map(async (m) => {
      // Overall 90-day uptime
      const stats = await db
        .select({
          total: sql<number>`count(*)`,
          up: sql<number>`count(*) filter (where ${checkResults.status} = 'up')`,
        })
        .from(checkResults)
        .where(
          and(
            eq(checkResults.monitorId, m.id),
            sql`${checkResults.checkedAt} > ${ninetyDaysAgo.toISOString()}`,
          ),
        );
      const total = Number(stats[0]?.total || 0);
      const up = Number(stats[0]?.up || 0);

      // Daily uptime for the last 90 days
      const dailyStats = await db
        .select({
          day: sql<string>`date(${checkResults.checkedAt})`,
          total: sql<number>`count(*)`,
          up: sql<number>`count(*) filter (where ${checkResults.status} = 'up')`,
        })
        .from(checkResults)
        .where(
          and(
            eq(checkResults.monitorId, m.id),
            sql`${checkResults.checkedAt} > ${ninetyDaysAgo.toISOString()}`,
          ),
        )
        .groupBy(sql`date(${checkResults.checkedAt})`)
        .orderBy(sql`date(${checkResults.checkedAt})`);

      const dailyMap = new Map(dailyStats.map((d) => [d.day, d]));
      const dailyUptime: Array<{ date: string; percent: number | null; total: number }> = [];
      for (let i = 89; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const day = dailyMap.get(date);
        if (day && Number(day.total) > 0) {
          dailyUptime.push({ date, percent: (Number(day.up) / Number(day.total)) * 100, total: Number(day.total) });
        } else {
          dailyUptime.push({ date, percent: null, total: 0 });
        }
      }

      // Recent response times (last 30 checks)
      const recentChecks = await db
        .select({ responseMs: checkResults.responseMs })
        .from(checkResults)
        .where(and(eq(checkResults.monitorId, m.id), sql`${checkResults.responseMs} is not null`))
        .orderBy(desc(checkResults.checkedAt))
        .limit(30);
      const recentResponseMs = recentChecks.map((c) => Number(c.responseMs)).reverse();

      return {
        name: m.name,
        status: m.status,
        lastCheckedAt: m.lastCheckedAt?.toISOString() ?? null,
        uptimePercent: total > 0 ? ((up / total) * 100).toFixed(2) : null,
        groupName: m.groupName,
        dailyUptime,
        recentResponseMs,
      };
    }),
  );

  // Active incidents with updates
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
    activeIncidents.map(async (incident) => ({
      id: incident.id,
      title: incident.title,
      status: incident.status,
      severity: incident.severity,
      startedAt: incident.startedAt.toISOString(),
      updates: await fetchIncidentUpdates(incident.id),
    })),
  );

  // Recent resolved incidents (history)
  const recentResolved = await db
    .select()
    .from(incidents)
    .where(
      and(
        eq(incidents.statusPageId, page.id),
        sql`${incidents.status} = 'resolved'`,
      ),
    )
    .orderBy(desc(incidents.resolvedAt))
    .limit(5);

  const resolvedWithUpdates = await Promise.all(
    recentResolved.map(async (incident) => ({
      id: incident.id,
      title: incident.title,
      status: incident.status,
      severity: incident.severity,
      startedAt: incident.startedAt.toISOString(),
      resolvedAt: incident.resolvedAt?.toISOString() ?? null,
      updates: await fetchIncidentUpdates(incident.id),
    })),
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

  // Overall status — active maintenance downgrades outages to "degraded"
  // since the operator has declared the disruption expected.
  const hasDown = monitorRows.some((m) => m.status === "down");
  const hasDegraded = monitorRows.some((m) => m.status === "degraded");
  let overallStatus: "operational" | "degraded" | "major_outage";
  if (hasDown && !anyMaintenanceActive) overallStatus = "major_outage";
  else if (hasDown || hasDegraded || anyMaintenanceActive) overallStatus = "degraded";
  else overallStatus = "operational";

  // Owner-configurable visibility toggles. Each defaults to true (existing
  // behavior); when off, we omit the underlying data so the renderer's existing
  // "no data → no section" conditionals hide the section cleanly.
  const monitorsForRender = page.showUptimeBars
    ? monitorsWithUptime
    : monitorsWithUptime.map(({ dailyUptime: _dailyUptime, ...rest }) => rest);

  return {
    generatedAt: new Date().toISOString(),
    statusPage: {
      name: page.name,
      slug: page.slug,
      logoUrl: page.logoUrl,
      brandColor: page.brandColor,
    },
    overallStatus,
    monitors: monitorsForRender,
    activeIncidents: incidentsWithUpdates,
    resolvedIncidents: page.showIncidentHistory ? resolvedWithUpdates : undefined,
    maintenanceWindows: page.showMaintenance ? maintenanceForRender : undefined,
    subscribeEndpoint: page.allowSubscribe ? `/status/${page.slug}/subscribe` : undefined,
  };
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

  const jsonData = await buildStatusPageData(page);
  const html = renderStatusHtml(jsonData);

  pageStore.set(page.slug, { json: jsonData, html });
  logger.info(`[StaticGen] Regenerated status page: ${page.slug}`);
}

// slug is validated at create time (regex /^[a-z0-9-]+$/) but we escape here
// too — cheap insurance if that invariant ever weakens.
function escapeAttrValue(input: string): string {
  return input.replace(/[^a-z0-9-]/gi, "");
}

// Pick a readable (#141018 or #fff) foreground for text placed on top of the
// user-chosen brand colour, so a light brand (e.g. yellow) doesn't render as
// white-on-white. Falls back to white for non-hex tokens (named colours).
function readableForeground(color: string): string {
  const hex = color.trim().replace(/^#/, "");
  let r: number, g: number, b: number;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    return "#ffffff";
  }
  if ([r, g, b].some((v) => Number.isNaN(v))) return "#ffffff";
  // YIQ perceived brightness — light brand → dark text, dark brand → white text.
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#141018" : "#ffffff";
}

export function renderStatusHtml(data: StaticStatusPage): string {
  const brand = sanitizeColor(data.statusPage.brandColor);
  const brandFg = readableForeground(brand);
  const pageName = escapeHtml(data.statusPage.name);
  const logoUrl = sanitizeUrl(data.statusPage.logoUrl);
  const slugAttr = escapeAttrValue(data.statusPage.slug);

  // Inline crow mark (works on custom domains too, where /assets aren't served).
  const crowSvg = (size: number) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 270 270" aria-hidden="true" style="flex-shrink:0"><rect width="270" height="270" rx="61" fill="#767E8F"/><path d="M208 83L237 55L155 105L135 85L115 105L33 55L62 83L0 225C0 241 22 270 62 270H208C248 270 270 241 270 225L208 83Z" fill="#353A46"/><path d="M188.5 103L167 116c3 8 12.5 11.6 17 10.5 5-1.25 10-5 10-12.5 0-6-3.3-9.8-5.5-11Z" fill="#59F94F"/><path d="M81.5 103L103 116c-3 8-12.5 11.6-17 10.5-5-1.25-10-5-10-12.5 0-6 3.3-9.8 5.5-11Z" fill="#59F94F"/><path d="M135 190V105l-35 40 20 15 15 30Z" fill="#E29B4C"/><path d="M135 190V105l35 40-20 15-15 30Z" fill="#F3BC6F"/></svg>`;

  // Overall uptime across all monitors — the headline trust metric.
  const uptimeVals = data.monitors
    .map((m) => (m.uptimePercent ? parseFloat(m.uptimePercent) : null))
    .filter((v): v is number => v !== null && !Number.isNaN(v));
  const overallUptime = uptimeVals.length
    ? (uptimeVals.reduce((a, b) => a + b, 0) / uptimeVals.length).toFixed(2)
    : null;
  const activeCount = data.activeIncidents.length;

  const statusKey =
    data.overallStatus === "operational" ? "ok"
      : data.overallStatus === "degraded" ? "warn"
      : "bad";
  const statusHeadline =
    data.overallStatus === "operational" ? "All systems operational."
      : data.overallStatus === "degraded" ? "Degraded performance."
      : "Major outage in progress.";

  function statusClass(status: string) {
    return status === "up" ? "ok"
      : status === "down" ? "bad"
      : status === "degraded" ? "warn"
      : "mute";
  }
  function statusText(status: string) {
    return status === "up" ? "Operational"
      : status === "down" ? "Outage"
      : status === "degraded" ? "Degraded"
      : "Unknown";
  }
  function incidentStatusClass(s: string) {
    return s === "investigating" ? "bad"
      : s === "identified" ? "warn"
      : s === "monitoring" ? "info"
      : "ok";
  }
  function incidentStatusLabel(s: string) {
    return s === "investigating" ? "Investigating"
      : s === "identified" ? "Identified"
      : s === "monitoring" ? "Monitoring"
      : "Resolved";
  }
  function severityClass(sev: string) {
    return sev === "critical" ? "bad" : sev === "major" ? "warn" : "note";
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
  function formatDuration(startIso: string, endIso: string) {
    const mins = Math.max(0, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000));
    if (mins < 1) return "under a minute";
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs < 24) return remMins ? `${hrs}h ${remMins}m` : `${hrs}h`;
    const days = Math.floor(hrs / 24);
    const remHrs = hrs % 24;
    return remHrs ? `${days}d ${remHrs}h` : `${days}d`;
  }

  function renderUptimeBar(daily: Array<{ date: string; percent: number | null; total: number }>, monitorName: string) {
    if (!daily || daily.length === 0) return "";
    const bars = daily.map((d) => {
      let cls: string;
      let tip: string;
      const dateLabel = formatDate(d.date + "T00:00:00Z");
      if (d.total === 0) {
        cls = "b-empty";
        tip = `${dateLabel} — no data`;
      } else if (d.percent !== null && d.percent >= 99.5) {
        cls = "b-ok";
        tip = `${dateLabel} — ${d.percent.toFixed(2)}% up`;
      } else if (d.percent !== null && d.percent >= 95) {
        cls = "b-warn";
        tip = `${dateLabel} — ${d.percent.toFixed(2)}% up`;
      } else {
        cls = "b-bad";
        tip = `${dateLabel} — ${d.percent?.toFixed(2) ?? 0}% up`;
      }
      return `<i class="b ${cls}" data-tip="${escapeHtml(tip)}"></i>`;
    }).join("");
    const hasData = daily.some((d) => d.total > 0);
    const labels = hasData
      ? `<span>${daily.length}d ago</span><span>today</span>`
      : `<span>collecting data — fills in as checks run</span>`;
    return `<div class="track-wrap">
  <div class="track" role="img" aria-label="${escapeHtml(`${daily.length}-day uptime history for ${monitorName}`)}">${bars}</div>
  <div class="track-labels mono">${labels}</div>
</div>`;
  }

  function renderMonitorRow(m: typeof data.monitors[number]) {
    const sc = statusClass(m.status);
    const st = statusText(m.status);
    const uptimePct = m.uptimePercent ? parseFloat(m.uptimePercent) : null;
    const uptimeCls = uptimePct === null ? "mute"
      : uptimePct >= 99 ? "ok"
      : uptimePct >= 95 ? "warn"
      : "bad";
    const bar = renderUptimeBar(m.dailyUptime ?? [], m.name);
    const ms = m.recentResponseMs && m.recentResponseMs.length
      ? m.recentResponseMs[m.recentResponseMs.length - 1]
      : null;
    return `<div class="svc">
  <div class="svc-top">
    <span class="dot c-${sc}"></span>
    <span class="svc-name">${escapeHtml(m.name)}</span>
    <span class="svc-fill"></span>
    ${ms !== null && m.status !== "down" ? `<span class="svc-ms mono">${ms}<span class="unit">ms</span></span>` : ""}
    ${uptimePct !== null ? `<span class="svc-uptime mono t-${uptimeCls}">${m.uptimePercent}%</span>` : ""}
    <span class="svc-word mono t-${sc}">${st}</span>
  </div>
  ${bar}
</div>`;
  }

  // Monitors section — render grouped or flat
  let monitorsHtml: string;
  if (data.monitors.length === 0) {
    monitorsHtml = '<p class="ledger-empty mono">No services configured.</p>';
  } else {
    const hasGroups = data.monitors.some((m) => m.groupName);
    if (!hasGroups) {
      monitorsHtml = data.monitors.map(renderMonitorRow).join("");
    } else {
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
        return `<div class="grp">
  <div class="grp-label mono">${label}</div>
  ${groupMonitors.map(renderMonitorRow).join("")}
</div>`;
      }).join("");
    }
  }

  function renderIncidentUpdates(updates: Array<{ status: string; body: string; createdAt: string }>) {
    if (updates.length === 0) return "";
    return `<div class="updates">${updates.map((u, i) => {
      const uc = incidentStatusClass(u.status);
      const ul = incidentStatusLabel(u.status);
      return `<div class="upd">
    <div class="upd-rail">
      <span class="upd-dot c-${uc}"></span>
      ${i < updates.length - 1 ? '<span class="upd-line"></span>' : ""}
    </div>
    <div class="upd-body">
      <div class="upd-head">
        <span class="upd-status mono t-${uc}">${ul}</span>
        <span class="upd-time mono">${formatDateTime(u.createdAt)}</span>
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
    const sc = incidentStatusClass(inc.status);
    const sl = incidentStatusLabel(inc.status);
    const sevCls = severityClass(inc.severity);
    const sevLabel = inc.severity.charAt(0).toUpperCase() + inc.severity.slice(1);
    const meta: string[] = [
      `<span class="sev"><span class="sev-dot c-${sevCls}"></span>${sevLabel}</span>`,
    ];
    if (isResolved && inc.resolvedAt) {
      meta.push(`resolved ${timeAgo(inc.resolvedAt)}`);
      meta.push(`lasted ${formatDuration(inc.startedAt, inc.resolvedAt)}`);
    } else {
      meta.push(`started ${timeAgo(inc.startedAt)}`);
    }
    return `<article class="inc">
  <div class="inc-head">
    <h3 class="inc-title">${escapeHtml(inc.title)}</h3>
    <span class="pill p-${sc} mono">${sl}</span>
  </div>
  <div class="inc-meta mono">${meta.join('<span class="msep">/</span>')}</div>
  ${renderIncidentUpdates(inc.updates)}
</article>`;
  }

  function renderMaintenance(m: NonNullable<StaticStatusPage["maintenanceWindows"]>[number]) {
    const cls = m.isActive ? "info" : "maint";
    const label = m.isActive ? "In Progress" : "Scheduled";
    const start = formatDate(m.scheduledStart);
    const end = formatDate(m.scheduledEnd);
    return `<article class="inc">
  <div class="inc-head">
    <h3 class="inc-title">${escapeHtml(m.title)}</h3>
    <span class="pill p-${cls} mono">${label}</span>
  </div>
  <div class="inc-meta mono"><span class="sev"><span class="sev-dot c-${cls}"></span>Maintenance</span><span class="msep">/</span>${start} &rarr; ${end}</div>
  ${m.body ? `<div class="md" style="margin-top:14px">${renderMarkdown(m.body)}</div>` : ""}
</article>`;
  }

  const activeIncidentsSection = data.activeIncidents.length > 0
    ? `<section class="section reveal" style="--d:2">
  <h2 class="sec-label mono"><span class="sec-dot c-bad"></span>Active incidents<span class="sec-count mono">${data.activeIncidents.length}</span></h2>
  ${data.activeIncidents.map((inc) => renderIncident(inc)).join("")}
</section>`
    : "";

  const maintenanceSection = (data.maintenanceWindows && data.maintenanceWindows.length > 0)
    ? `<section class="section reveal" style="--d:3">
  <h2 class="sec-label mono"><span class="sec-dot c-info"></span>Scheduled maintenance</h2>
  ${data.maintenanceWindows.map(renderMaintenance).join("")}
</section>`
    : "";

  // When resolvedIncidents is undefined the owner has hidden the history
  // section entirely; an empty array means "history on, but nothing to show"
  // and still renders the reassuring "all quiet" empty state.
  const resolvedSection = data.resolvedIncidents === undefined
    ? ""
    : data.resolvedIncidents.length > 0
    ? `<section class="section reveal" style="--d:4">
  <h2 class="sec-label mono"><span class="sec-dot c-mute"></span>Incident history</h2>
  ${data.resolvedIncidents.map((inc) => renderIncident(inc, true)).join("")}
</section>`
    : `<section class="section reveal" style="--d:4">
  <h2 class="sec-label mono"><span class="sec-dot c-mute"></span>Incident history</h2>
  <div class="empty">
    <span class="empty-crow">${crowSvg(36)}</span>
    <p><strong>All quiet.</strong> No incidents in the past 90 days &mdash; the crow kept watch.</p>
  </div>
</section>`;

  const subscribeSection = data.subscribeEndpoint
    ? `<section class="sub reveal" style="--d:5">
  <div class="sub-copy">
    <h3 class="sub-title">Get incident updates.</h3>
    <p class="sub-desc">One email when an incident starts, one when it resolves. No noise.</p>
  </div>
  <form id="subscribe-form" class="sub-form">
    <input type="email" id="sub-email" class="sub-input mono" placeholder="you@company.com" required autocomplete="email" aria-label="Email address" />
    <button type="submit" class="sub-btn" style="background:${brand};color:${brandFg}">Subscribe</button>
  </form>
  <p id="subscribe-msg" class="sub-msg mono" role="status"></p>
</section>`
    : "";

  // Grain texture — tiny inline SVG turbulence, gives the page its "paper" feel.
  const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${pageName} &mdash; Status</title>
  <link rel="alternate" type="application/rss+xml" title="${pageName} incidents" href="/status/${slugAttr}/rss">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 270 270'%3E%3Crect width='270' height='270' rx='61' fill='%23767E8F'/%3E%3Cpath d='M208 83L237 55L155 105L135 85L115 105L33 55L62 83L0 225C0 241 22 270 62 270H208C248 270 270 241 270 225L208 83Z' fill='%23353A46'/%3E%3Cpath d='M188.5 103L167 116c3 8 12.5 11.6 17 10.5 5-1.25 10-5 10-12.5 0-6-3.3-9.8-5.5-11Z' fill='%2359F94F'/%3E%3Cpath d='M81.5 103L103 116c-3 8-12.5 11.6-17 10.5-5-1.25-10-5-10-12.5 0-6 3.3-9.8 5.5-11Z' fill='%2359F94F'/%3E%3Cpath d='M135 190V105l-35 40 20 15 15 30Z' fill='%23E29B4C'/%3E%3Cpath d='M135 190V105l35 40-20 15-15 30Z' fill='%23F3BC6F'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    /* ── The Watch Log ─────────────────────────────────────────────────────
       UptimeCrow signature: warm paper, ink type, mono instrumentation.
       The customer's brand colour stays the accent; status colours carry
       meaning; everything else is calm. */
    :root{
      --bg:#f4eee1;--card:#fcf9f1;--card2:#f7f1e2;
      --ink:#1d1922;--text2:#6d6675;--text3:#a29aa8;
      --line:#e5dcc6;--line2:#d2c6ab;
      --ok:#187f43;--warn:#b45309;--bad:#c2342c;--info:#2563eb;--maint:#7c3aed;--note:#a16207;--mute:#a29aa8;
      --bar-empty:#e9e0ca;
      --brand:${brand};
      --shadow:0 1px 2px rgba(42,34,48,.04),0 12px 30px -22px rgba(42,34,48,.25);
      --r:14px;--r-sm:10px;
    }
    [data-theme="dark"]{
      --bg:#141018;--card:#1c1721;--card2:#211b27;
      --ink:#f0ebe2;--text2:#a79fae;--text3:#6f6876;
      --line:#2e2735;--line2:#3e3548;
      --ok:#2fce6f;--warn:#f5a623;--bad:#f05548;--info:#60a5fa;--maint:#a78bfa;--note:#eab308;--mute:#6f6876;
      --bar-empty:#2e2735;
      --shadow:0 1px 2px rgba(0,0,0,.35),0 18px 40px -26px rgba(0,0,0,.7);
    }
    html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;scroll-behavior:smooth}
    body{background:var(--bg);color:var(--ink);font-family:'Bricolage Grotesque',system-ui,sans-serif;line-height:1.5;min-height:100vh;position:relative}
    body::after{content:'';position:fixed;inset:0;background-image:${grain};opacity:.28;pointer-events:none;z-index:999;mix-blend-mode:multiply}
    [data-theme="dark"] body::after{opacity:.14;mix-blend-mode:screen}
    .mono{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums}
    ::selection{background:var(--ink);color:var(--bg)}
    /* status colour utilities */
    .t-ok{color:var(--ok)}.t-warn{color:var(--warn)}.t-bad{color:var(--bad)}.t-info{color:var(--info)}.t-mute{color:var(--text3)}.t-note{color:var(--note)}
    .c-ok{background:var(--ok)}.c-warn{background:var(--warn)}.c-bad{background:var(--bad)}.c-info{background:var(--info)}.c-maint{background:var(--maint)}.c-mute{background:var(--text3)}.c-note{background:var(--note)}

    /* ── Status accent bar ── */
    .accent-bar{height:3px;position:sticky;top:0;z-index:100}
    .accent-bar.a-ok{background:var(--ok)}.accent-bar.a-warn{background:var(--warn)}.accent-bar.a-bad{background:var(--bad);animation:alert-sweep 2.2s linear infinite;background-image:linear-gradient(90deg,var(--bad) 0%,#ff8a7f 50%,var(--bad) 100%);background-size:200% 100%}
    @keyframes alert-sweep{from{background-position:200% 0}to{background-position:0 0}}

    .wrap{max-width:760px;margin:0 auto;padding:0 22px 90px;position:relative}

    /* ── Reveal motion ── */
    .reveal{animation:rise .55s cubic-bezier(.22,.8,.3,1) both;animation-delay:calc(var(--d,0)*70ms)}
    @keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    @media(prefers-reduced-motion:reduce){.reveal,.accent-bar.a-bad,.signal::before,.signal::after,.live-dot{animation:none!important}}

    /* ── Navbar ── */
    .navbar{display:flex;align-items:center;justify-content:space-between;padding:22px 0 34px}
    .nav-brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:var(--ink)}
    .nav-logo{height:28px;border-radius:6px;flex-shrink:0}
    .nav-name{font-size:16px;font-weight:700;letter-spacing:-.02em}
    .nav-right{display:flex;align-items:center;gap:9px}
    .live-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border-radius:20px;border:1px solid var(--line2);font-size:10.5px;font-weight:500;color:var(--text2);letter-spacing:.04em}
    .live-dot{width:6px;height:6px;border-radius:50%;background:var(--ok);animation:pulse-dot 2.4s ease-in-out infinite;flex-shrink:0}
    @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.8)}}
    .theme-btn{background:var(--card);border:1px solid var(--line2);border-radius:8px;color:var(--text2);cursor:pointer;padding:6px 11px;font-size:11px;font-weight:500;font-family:'IBM Plex Mono',monospace;transition:border-color .15s,color .15s;line-height:1;display:flex;align-items:center;gap:5px}
    .theme-btn:hover{border-color:var(--text3);color:var(--ink)}

    /* ── Hero ── */
    .hero{display:flex;align-items:flex-start;gap:20px;padding:14px 0 8px}
    .signal{width:16px;height:16px;border-radius:50%;flex-shrink:0;margin-top:14px;position:relative}
    .signal::before,.signal::after{content:'';position:absolute;inset:0;border-radius:50%;background:inherit;animation:ping 2.6s cubic-bezier(0,0,.2,1) infinite}
    .signal::after{animation-delay:1.3s}
    @keyframes ping{0%{transform:scale(1);opacity:.55}80%,100%{transform:scale(3.1);opacity:0}}
    .hero-main{flex:1;min-width:0}
    .hero-title{font-size:clamp(30px,5.4vw,44px);font-weight:800;letter-spacing:-.035em;line-height:1.04;text-wrap:balance}
    .hero-title.h-warn{color:var(--warn)}.hero-title.h-bad{color:var(--bad)}
    .hero-meta{margin-top:14px;font-size:12px;color:var(--text2);display:flex;align-items:center;gap:10px;flex-wrap:wrap;letter-spacing:.01em}
    .hero-meta .sep{color:var(--line2)}
    .hero-meta .alert{color:var(--bad);font-weight:600}
    .hero-uptime{flex-shrink:0;text-align:right;padding-top:4px}
    .hero-uptime .big{font-size:38px;font-weight:600;letter-spacing:-.04em;line-height:1;color:var(--ink)}
    .hero-uptime .big .pct{font-size:20px;color:var(--text3);margin-left:1px}
    .hero-uptime .lbl{font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:var(--text3);margin-top:7px}
    .meta-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:26px 0 10px;font-size:11px;color:var(--text3)}
    .meta-refresh-btn{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:500;color:var(--text3);background:transparent;border:0;cursor:pointer;font-family:'IBM Plex Mono',monospace;transition:color .15s}
    .meta-refresh-btn:hover{color:var(--ink)}

    /* ── Sections ── */
    .section{margin-top:44px}
    .sec-label{display:flex;align-items:center;gap:9px;margin-bottom:14px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.16em;color:var(--text2)}
    .sec-label::after{content:'';flex:1;height:1px;background:var(--line)}
    .sec-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
    .sec-count{padding:1px 8px;border-radius:12px;font-size:10px;font-weight:600;background:var(--bad);color:#fff}

    /* ── Services ledger ── */
    .ledger{background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);overflow:hidden}
    .ledger-empty{font-size:12px;color:var(--text3);padding:22px 24px}
    .grp-label{font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--text3);padding:14px 24px 0}
    .svc{padding:18px 24px;border-bottom:1px solid var(--line)}
    .grp:last-child .svc:last-child,.ledger>.svc:last-child{border-bottom:0}
    .svc-top{display:flex;align-items:center;gap:12px;margin-bottom:13px}
    .dot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
    .svc-name{font-size:15px;font-weight:600;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .svc-fill{flex:1}
    .svc-ms{font-size:12px;color:var(--text2)}
    .svc-ms .unit{color:var(--text3);margin-left:2px;font-size:10px}
    .svc-uptime{font-size:13px;font-weight:600}
    .svc-word{font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase}
    .track-wrap{margin-top:2px}
    .track{display:flex;gap:2px;height:34px;align-items:stretch;transform-origin:bottom;animation:grow .5s cubic-bezier(.22,.8,.3,1) both;animation-delay:.15s}
    @keyframes grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
    @media(prefers-reduced-motion:reduce){.track{animation:none}}
    .b{flex:1;min-width:0;border-radius:2px;cursor:default;transition:filter .12s,transform .12s}
    .b:hover{filter:brightness(1.18);transform:scaleY(1.08)}
    .b-ok{background:var(--ok)}.b-warn{background:var(--warn)}.b-bad{background:var(--bad)}.b-empty{background:var(--bar-empty)}
    .track-labels{display:flex;justify-content:space-between;margin-top:7px;font-size:9.5px;color:var(--text3);letter-spacing:.04em}
    #tip{position:fixed;z-index:1000;pointer-events:none;background:var(--ink);color:var(--bg);font-family:'IBM Plex Mono',monospace;font-size:10.5px;padding:5px 9px;border-radius:6px;white-space:nowrap;opacity:0;transition:opacity .1s;transform:translate(-50%,calc(-100% - 8px))}

    /* ── Incident cards ── */
    .inc{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:22px 24px;margin-bottom:12px;box-shadow:var(--shadow)}
    .inc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
    .inc-title{font-size:17px;font-weight:700;letter-spacing:-.015em;line-height:1.3;min-width:0}
    .pill{flex-shrink:0;font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:5px 11px;border-radius:20px;white-space:nowrap;border:1px solid}
    .p-ok{color:var(--ok);border-color:var(--ok)}.p-warn{color:var(--warn);border-color:var(--warn)}.p-bad{color:var(--bad);border-color:var(--bad)}.p-info{color:var(--info);border-color:var(--info)}.p-maint{color:var(--maint);border-color:var(--maint)}
    .inc-meta{margin-top:10px;font-size:11px;color:var(--text3);display:flex;align-items:center;gap:9px;flex-wrap:wrap;letter-spacing:.01em}
    .msep{color:var(--line2)}
    .sev{display:inline-flex;align-items:center;gap:6px;font-weight:500;color:var(--text2)}
    .sev-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
    .updates{margin-top:18px;padding-top:18px;border-top:1px dashed var(--line2)}
    .upd{display:flex;gap:15px;padding-bottom:18px}
    .upd:last-child{padding-bottom:0}
    .upd-rail{display:flex;flex-direction:column;align-items:center;flex-shrink:0;padding-top:3px}
    .upd-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
    .upd-line{width:1px;flex:1;background:var(--line2);margin-top:6px;min-height:14px}
    .upd-body{flex:1;min-width:0}
    .upd-head{display:flex;align-items:baseline;gap:10px;margin-bottom:5px;flex-wrap:wrap}
    .upd-status{font-size:10.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase}
    .upd-time{font-size:10.5px;color:var(--text3)}
    .md{font-size:13.5px;color:var(--text2);line-height:1.65}
    .md p{margin:0 0 8px}.md p:last-child{margin-bottom:0}
    .md ul,.md ol{margin:6px 0 8px 20px}
    .md li{margin:2px 0}
    .md code{background:var(--card2);border:1px solid var(--line);padding:1px 6px;border-radius:4px;font-family:'IBM Plex Mono',monospace;font-size:12px}
    .md a{color:var(--brand);text-decoration:underline}
    .md strong{color:var(--ink)}

    /* ── Empty state ── */
    .empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:36px 0;font-size:13.5px;color:var(--text2);text-align:center;border:1px dashed var(--line2);border-radius:var(--r);background:var(--card2)}
    .empty-crow{opacity:.9}
    .empty strong{color:var(--ink)}

    /* ── Subscribe (inverse band) ── */
    .sub{margin-top:52px;background:var(--ink);color:var(--bg);border-radius:var(--r);padding:28px;box-shadow:var(--shadow)}
    .sub-title{font-size:19px;font-weight:700;letter-spacing:-.02em}
    .sub-desc{font-size:12.5px;opacity:.65;margin-top:4px}
    .sub-form{display:flex;gap:8px;max-width:460px;margin-top:18px}
    .sub-input{flex:1;padding:11px 14px;border:1px solid color-mix(in srgb,var(--bg) 25%,transparent);border-radius:9px;background:color-mix(in srgb,var(--bg) 8%,transparent);color:var(--bg);font-size:12.5px;outline:none;transition:border-color .15s;min-width:0}
    .sub-input:focus{border-color:var(--brand)}
    .sub-input::placeholder{color:color-mix(in srgb,var(--bg) 45%,transparent)}
    .sub-btn{padding:11px 20px;border:none;border-radius:9px;font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;transition:transform .15s,filter .15s;white-space:nowrap;flex-shrink:0;letter-spacing:-.01em}
    .sub-btn:hover{transform:translateY(-1px);filter:brightness(1.06)}
    .sub-btn:disabled{opacity:.6;cursor:default;transform:none}
    .sub-msg{font-size:11px;margin-top:10px;min-height:16px;opacity:.9}

    /* ── Footer ── */
    .page-footer{margin-top:60px;padding-top:20px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--text3);flex-wrap:wrap;gap:10px;font-family:'IBM Plex Mono',monospace}
    .page-footer a{color:var(--text3);text-decoration:none;transition:color .15s;display:inline-flex;align-items:center;gap:5px}
    .page-footer a:hover{color:var(--ink)}
    .footer-powered strong{color:var(--text2);font-weight:600}
    .footer-powered:hover strong{color:var(--ink)}
    .footer-powered svg{border-radius:4px}

    @media(max-width:620px){
      .wrap{padding:0 16px 60px}
      .hero{flex-wrap:wrap;gap:14px}
      .signal{margin-top:10px}
      .hero-uptime{text-align:left;width:100%;padding-left:36px;padding-top:0}
      .svc-top{flex-wrap:wrap;row-gap:6px}
      .svc-fill{display:none}
      .svc-name{flex:1 1 auto;white-space:normal;overflow:visible}
      .svc-ms,.svc-uptime,.svc-word{margin-left:0}
      .svc-top>.svc-ms{margin-left:21px}
      .sub-form{flex-direction:column}
      .page-footer{flex-direction:column;justify-content:center;text-align:center}
      .navbar{padding:18px 0 24px}
    }
  </style>
</head>
<body>
  <div class="accent-bar a-${statusKey}"></div>
  <div class="wrap">

    <!-- Navbar -->
    <nav class="navbar reveal" style="--d:0">
      <div class="nav-brand">
        ${logoUrl ? `<img src="${logoUrl}" alt="${pageName}" class="nav-logo">` : ""}
        <span class="nav-name">${pageName}</span>
      </div>
      <div class="nav-right">
        <span class="live-pill mono">
          <span class="live-dot"></span>
          <span id="refresh-label">LIVE</span>
        </span>
        <button class="theme-btn" onclick="toggleTheme()" id="theme-btn" aria-label="Toggle color theme">
          <svg id="theme-icon-moon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg id="theme-icon-sun" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <span id="theme-label">dark</span>
        </button>
      </div>
    </nav>

    <!-- Hero -->
    <header class="hero reveal" style="--d:1">
      <span class="signal c-${statusKey}" aria-hidden="true"></span>
      <div class="hero-main">
        <h1 class="hero-title h-${statusKey}">${statusHeadline}</h1>
        <div class="hero-meta mono">
          <span id="last-updated">updated just now</span>
          <span class="sep">/</span>
          <span>${data.monitors.length} service${data.monitors.length !== 1 ? "s" : ""} watched</span>
          ${activeCount > 0 ? `<span class="sep">/</span><span class="alert">${activeCount} active incident${activeCount !== 1 ? "s" : ""}</span>` : ""}
        </div>
      </div>
      ${overallUptime ? `<div class="hero-uptime mono">
        <div class="big">${overallUptime}<span class="pct">%</span></div>
        <div class="lbl">90-day uptime</div>
      </div>` : ""}
    </header>

    <!-- Meta row -->
    <div class="meta-row mono reveal" style="--d:1">
      <span>auto-refresh in <span id="countdown">60</span>s</span>
      <button class="meta-refresh-btn" onclick="location.reload()">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        refresh now
      </button>
    </div>

    <!-- Services -->
    <section class="section reveal" style="--d:2">
      <h2 class="sec-label mono"><span class="sec-dot c-${statusKey}"></span>Services</h2>
      <div class="ledger">
        ${monitorsHtml}
      </div>
    </section>

    ${maintenanceSection}
    ${activeIncidentsSection}
    ${resolvedSection}
    ${subscribeSection}

    <!-- Footer -->
    <footer class="page-footer reveal" style="--d:6">
      <span>&copy; ${new Date().getFullYear()} ${pageName}</span>
      <div style="display:flex;align-items:center;gap:16px">
        <a href="/status/${slugAttr}/rss" title="RSS Feed" target="_blank" rel="noopener noreferrer">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/></svg>
          RSS
        </a>
        <a class="footer-powered" href="https://uptimecrow.com" target="_blank" rel="noopener noreferrer">
          ${crowSvg(16)}
          <span>Watched by <strong>UptimeCrow</strong></span>
        </a>
      </div>
    </footer>

  </div>
  <div id="tip" role="tooltip"></div>

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
      if (lbl) lbl.textContent = t === 'dark' ? 'light' : 'dark';
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
      if (updatedEl) updatedEl.textContent = 'updated ' + label;
      if (secs <= 0) location.reload();
    }
    setInterval(tick, 1000);

    // Uptime bar tooltip (single element, delegated)
    var tip = document.getElementById('tip');
    document.addEventListener('mouseover', function(e) {
      var t = e.target;
      if (!(t instanceof Element) || !t.classList.contains('b')) return;
      var text = t.getAttribute('data-tip');
      if (!text || !tip) return;
      tip.textContent = text;
      var r = t.getBoundingClientRect();
      tip.style.left = (r.left + r.width / 2) + 'px';
      tip.style.top = r.top + 'px';
      tip.style.opacity = '1';
    });
    document.addEventListener('mouseout', function(e) {
      var t = e.target;
      if (tip && t instanceof Element && t.classList.contains('b')) tip.style.opacity = '0';
    });
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
            msg.style.color = r.ok ? 'var(--ok)' : 'var(--bad)';
          }
          if (r.ok) { form.reset(); }
          if (btn) { btn.disabled = false; btn.textContent = 'Subscribe'; }
        })
        .catch(function() {
          if (msg) { msg.textContent = 'Something went wrong. Try again.'; msg.style.color = 'var(--bad)'; }
          if (btn) { btn.disabled = false; btn.textContent = 'Subscribe'; }
        });
    });
  })();` : ""}
  </script>
</body>
</html>`;
}
