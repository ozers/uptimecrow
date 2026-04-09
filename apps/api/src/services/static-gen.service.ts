// Static Generation Service — Pre-render status pages as JSON + HTML
// Renders are stored in-memory (Map) and served by a dedicated route.
// Can be swapped to Cloudflare R2 / S3 in production.

import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  statusPages,
  monitors,
  incidents,
  incidentUpdates,
  checkResults,
} from "../db/schema.js";

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
}

// In-memory store for rendered pages. Key = slug.
const pageStore = new Map<string, { json: StaticStatusPage; html: string }>();

export function getRenderedPage(slug: string) {
  return pageStore.get(slug) ?? null;
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
    console.error(`[StaticGen] Status page ${statusPageId} not found`);
    return;
  }

  // Fetch monitors
  const orgMonitors = await db
    .select()
    .from(monitors)
    .where(and(eq(monitors.orgId, page.orgId), eq(monitors.isActive, true)));

  // Calculate per-monitor 30-day uptime
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const monitorsWithUptime = await Promise.all(
    orgMonitors.map(async (m) => {
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
      };
    }),
  );

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

  // Determine overall status
  const hasDown = orgMonitors.some((m) => m.status === "down");
  const hasDegraded = orgMonitors.some((m) => m.status === "degraded");
  const overallStatus = hasDown
    ? "major_outage"
    : hasDegraded
      ? "degraded"
      : "operational";

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
  };

  const html = renderStatusHtml(jsonData);

  pageStore.set(page.slug, { json: jsonData, html });
  console.log(`[StaticGen] Regenerated status page: ${page.slug}`);
}

export function renderStatusHtml(data: StaticStatusPage): string {
  const statusColor =
    data.overallStatus === "operational"
      ? "#00e676"
      : data.overallStatus === "degraded"
        ? "#ffab40"
        : "#ff5252";

  const statusLabel =
    data.overallStatus === "operational"
      ? "All Systems Operational"
      : data.overallStatus === "degraded"
        ? "Degraded Performance"
        : "Major Outage";

  const monitorsHtml = data.monitors
    .map((m) => {
      const dot =
        m.status === "up"
          ? "#00e676"
          : m.status === "down"
            ? "#ff5252"
            : m.status === "degraded"
              ? "#ffab40"
              : "#999";
      return `<div class="monitor-row">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="width:8px;height:8px;border-radius:50%;background:${dot};display:inline-block;"></span>
          <span>${m.name}</span>
        </div>
        <span class="uptime-text">${m.uptimePercent ? m.uptimePercent + "%" : "—"}</span>
      </div>`;
    })
    .join("");

  const incidentsHtml =
    data.activeIncidents.length === 0
      ? ""
      : `<div style="margin-top:32px;">
        <h2 style="font-size:18px;margin-bottom:16px;">Active Incidents</h2>
        ${data.activeIncidents
          .map(
            (inc) => `<div class="incident-card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong>${inc.title}</strong>
              <span style="font-size:12px;padding:2px 8px;border-radius:4px;background:${inc.severity === "critical" ? "#fee2e2" : inc.severity === "major" ? "#ffedd5" : "#fef9c3"};color:${inc.severity === "critical" ? "#dc2626" : inc.severity === "major" ? "#ea580c" : "#ca8a04"};">${inc.severity}</span>
            </div>
            ${inc.updates
              .map(
                (u) =>
                  `<div class="incident-update">
                <p style="margin:0;font-size:14px;" class="update-body">${u.body}</p>
                <p style="margin:4px 0 0;font-size:12px;" class="update-meta">${u.status} — ${new Date(u.createdAt).toLocaleString()}</p>
              </div>`,
              )
              .join("")}
          </div>`,
          )
          .join("")}
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>${data.statusPage.name} — Status</title>
  <style>
    :root {
      --bg: #050507;
      --text: #ededf0;
      --text-secondary: #888;
      --text-muted: #666;
      --border: #222;
      --card-bg: #111;
      --update-border: #333;
      --brand: ${data.statusPage.brandColor};
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #fafafa;
        --text: #1a1a1a;
        --text-secondary: #6b7280;
        --text-muted: #9ca3af;
        --border: #e5e7eb;
        --card-bg: #f3f4f6;
        --update-border: #d1d5db;
      }
    }
    [data-theme="dark"] {
      --bg: #050507;
      --text: #ededf0;
      --text-secondary: #888;
      --text-muted: #666;
      --border: #222;
      --card-bg: #111;
      --update-border: #333;
    }
    [data-theme="light"] {
      --bg: #fafafa;
      --text: #1a1a1a;
      --text-secondary: #6b7280;
      --text-muted: #9ca3af;
      --border: #e5e7eb;
      --card-bg: #f3f4f6;
      --update-border: #d1d5db;
    }
    body {
      margin: 0; padding: 0;
      background: var(--bg); color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      transition: background 0.2s, color 0.2s;
    }
    a { color: var(--brand); }
    .monitor-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0; border-bottom: 1px solid var(--border);
    }
    .uptime-text { color: var(--text-secondary); font-size: 13px; }
    .incident-card {
      background: var(--card-bg); border-radius: 8px;
      padding: 16px; margin-bottom: 12px;
    }
    .incident-update {
      margin-top: 8px; padding-left: 12px;
      border-left: 2px solid var(--update-border);
    }
    .update-body { color: var(--text-secondary); }
    .update-meta { color: var(--text-muted); }
    .footer { text-align: center; color: var(--text-muted); font-size: 12px; margin-top: 48px; }
    .theme-toggle {
      background: none; border: 1px solid var(--border); border-radius: 6px;
      color: var(--text-secondary); cursor: pointer; padding: 6px 8px; font-size: 16px;
      transition: border-color 0.2s;
    }
    .theme-toggle:hover { border-color: var(--text-secondary); }
  </style>
</head>
<body>
  <div style="max-width:720px;margin:0 auto;padding:40px 20px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      ${data.statusPage.logoUrl ? `<img src="${data.statusPage.logoUrl}" alt="${data.statusPage.name}" style="height:32px;" />` : `<h1 style="font-size:24px;margin:0;">${data.statusPage.name}</h1>`}
      <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme" id="theme-btn"></button>
    </div>
    <div style="background:${statusColor}22;border:1px solid ${statusColor}44;border-radius:8px;padding:16px;margin-bottom:32px;">
      <span style="color:${statusColor};font-weight:600;">${statusLabel}</span>
    </div>
    <div>${monitorsHtml}</div>
    ${incidentsHtml}
    <p class="footer">Generated at ${data.generatedAt} — Powered by UptimeCrow</p>
  </div>
  <script>
    (function() {
      var stored = localStorage.getItem('uptimecrow-theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var theme = stored || (prefersDark ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
      updateBtn(theme);

      function updateBtn(t) {
        var btn = document.getElementById('theme-btn');
        if (btn) btn.textContent = t === 'dark' ? '\\u2600\\uFE0F' : '\\uD83C\\uDF19';
      }

      window.toggleTheme = function() {
        var current = document.documentElement.getAttribute('data-theme') || 'dark';
        var next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('uptimecrow-theme', next);
        updateBtn(next);
      };
    })();
  </script>
</body>
</html>`;
}
