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
import { escapeHtml, sanitizeUrl, sanitizeColor } from "../utils/escape.js";
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
    logger.error(`[StaticGen] Status page ${statusPageId} not found`);
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
  logger.info(`[StaticGen] Regenerated status page: ${page.slug}`);
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
  const statusEmoji =
    data.overallStatus === "operational" ? "&#10003;"
      : data.overallStatus === "degraded" ? "&#9888;"
      : "&#9888;";

  function dotColor(status: string) {
    return status === "up" ? "#22c55e" : status === "down" ? "#ef4444" : status === "degraded" ? "#f59e0b" : "#6b7280";
  }
  function statusText(status: string) {
    return status === "up" ? "Operational" : status === "down" ? "Down" : status === "degraded" ? "Degraded" : "Unknown";
  }
  function severityColor(sev: string) {
    return sev === "critical" ? "#ef4444" : sev === "major" ? "#f59e0b" : "#eab308";
  }
  function incidentStatusColor(s: string) {
    return s === "investigating" ? "#ef4444" : s === "identified" ? "#f59e0b" : s === "monitoring" ? "#3b82f6" : "#22c55e";
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
  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function renderUptimeBar(daily: Array<{ date: string; percent: number | null; total: number }>) {
    if (!daily || daily.length === 0) return '';
    const vw = 640, h = 28, gap = 1.5, count = daily.length;
    const slotW = (vw - (count - 1) * gap) / count;
    const rects = daily.map((d, i) => {
      const x = i * (slotW + gap);
      let fill: string;
      if (d.total === 0) fill = "var(--bar-empty)";
      else if (d.percent !== null && d.percent >= 99.5) fill = "#22c55e";
      else if (d.percent !== null && d.percent >= 95) fill = "#f59e0b";
      else fill = "#ef4444";
      const tip = d.total === 0 ? `${d.date}: No data` : `${d.date}: ${d.percent?.toFixed(1)}% uptime`;
      return `<rect x="${x.toFixed(2)}" y="0" width="${slotW.toFixed(2)}" height="${h}" rx="2" fill="${fill}"><title>${tip}</title></rect>`;
    }).join("");
    return `<svg width="100%" viewBox="0 0 ${vw} ${h}" preserveAspectRatio="none" style="display:block;border-radius:3px;overflow:hidden">${rects}</svg>`;
  }

  function renderSparkline(values: number[], color: string) {
    if (!values || values.length < 2) return '';
    const w = 120, h = 30, pad = 2;
    const max = Math.max(...values), min = Math.min(...values), range = max - min || 1;
    const points = values.map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    return `<div style="display:flex;align-items:center;gap:8px">
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="flex-shrink:0">
        <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
      </svg>
      <span style="font-size:12px;font-weight:600;color:var(--text2);font-variant-numeric:tabular-nums;white-space:nowrap">${avg}ms</span>
    </div>`;
  }

  const monitorsHtml = data.monitors.map((m) => {
    const bar = renderUptimeBar(m.dailyUptime ?? []);
    const spark = renderSparkline(m.recentResponseMs ?? [], brand);
    const dc = dotColor(m.status);
    const uptimePct = m.uptimePercent ? parseFloat(m.uptimePercent) : null;
    const uptimeColor = uptimePct === null ? "var(--text3)" : uptimePct >= 99.9 ? "#22c55e" : uptimePct >= 99 ? "#f59e0b" : "#ef4444";
    const dayCount = (m.dailyUptime ?? []).length;
    return `<div class="monitor-card">
  <div class="monitor-row">
    <div style="display:flex;align-items:center;gap:10px;min-width:0">
      <span class="status-dot" style="background:${dc};box-shadow:0 0 0 3px ${dc}22"></span>
      <span class="monitor-name">${escapeHtml(m.name)}</span>
      <span class="monitor-pill" style="color:${dc};background:${dc}15">${statusText(m.status)}</span>
    </div>
    <div style="display:flex;align-items:center;gap:16px;flex-shrink:0">
      ${spark}
      <span style="font-size:15px;font-weight:700;color:${uptimeColor};font-variant-numeric:tabular-nums;min-width:60px;text-align:right">${m.uptimePercent ? m.uptimePercent + "%" : "—"}</span>
    </div>
  </div>
  ${bar ? `<div style="margin-top:14px">
    ${bar}
    <div style="display:flex;justify-content:space-between;margin-top:5px;font-size:10px;color:var(--text3)">\
<span>${dayCount} days ago</span><span>Today</span></div>
  </div>` : ''}
</div>`;
  }).join("");

  function renderIncident(inc: {
    title: string; status: string; severity: string; startedAt: string;
    resolvedAt?: string | null;
    updates: Array<{ status: string; body: string; createdAt: string }>;
  }, isResolved = false) {
    const sc = incidentStatusColor(inc.status);
    const sev = inc.severity;
    const sevColor = severityColor(sev);
    const updatesHtml = inc.updates.length > 0 ? inc.updates.map((u) => {
      const uc = incidentStatusColor(u.status);
      return `<div class="timeline-row">
        <div style="display:flex;flex-direction:column;align-items:center;gap:0">
          <div style="width:8px;height:8px;border-radius:50%;background:${uc};flex-shrink:0;margin-top:3px"></div>
          <div style="width:1px;flex:1;background:var(--border);margin-top:4px"></div>
        </div>
        <div style="flex:1;padding-bottom:16px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="font-size:11px;font-weight:600;text-transform:capitalize;color:${uc}">${u.status}</span>
            <span style="font-size:11px;color:var(--text3)">${timeAgo(u.createdAt)}</span>
          </div>
          <p style="font-size:13px;color:var(--text2);line-height:1.6;margin:0;white-space:pre-wrap">${escapeHtml(u.body)}</p>
        </div>
      </div>`;
    }).join("") : '';
    return `<div class="incident-card" style="border-left:3px solid ${sc}">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px">
    <div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${sevColor};background:${sevColor}18;padding:1px 7px;border-radius:4px">${sev}</span>
        <span style="font-size:11px;font-weight:600;text-transform:capitalize;color:${sc}">${inc.status}</span>
      </div>
      <strong style="font-size:14px;font-weight:600;color:var(--text)">${escapeHtml(inc.title)}</strong>
    </div>
    <div style="text-align:right;flex-shrink:0">
      <div style="font-size:11px;color:var(--text3)">${formatDate(inc.startedAt)}</div>
      ${isResolved && inc.resolvedAt ? `<div style="font-size:11px;color:#22c55e;margin-top:2px">Resolved ${timeAgo(inc.resolvedAt)}</div>` : `<div style="font-size:11px;color:var(--text3);margin-top:2px">${timeAgo(inc.startedAt)}</div>`}
    </div>
  </div>
  ${updatesHtml ? `<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">${updatesHtml}</div>` : ''}
</div>`;
  }

  const activeIncidentsHtml = data.activeIncidents.length > 0
    ? `<section class="section">
    <div class="section-header">
      <span style="display:inline-flex;align-items:center;gap:6px">
        <span style="width:8px;height:8px;border-radius:50%;background:#ef4444;display:inline-block"></span>
        Active Incidents
      </span>
    </div>
    ${data.activeIncidents.map((inc) => renderIncident(inc)).join("")}
  </section>` : '';

  const resolvedIncidentsHtml = data.resolvedIncidents && data.resolvedIncidents.length > 0
    ? `<section class="section">
    <div class="section-header">Incident History</div>
    ${data.resolvedIncidents.map((inc) => renderIncident(inc, true)).join("")}
  </section>` : `<section class="section">
    <div class="section-header">Incident History</div>
    <div class="empty-state">No incidents recorded.</div>
  </section>`;

  const subscribeHtml = data.subscribeEndpoint
    ? `<div class="subscribe-box">
    <div style="margin-bottom:16px">
      <div style="font-size:14px;font-weight:600;margin-bottom:4px">Get notified</div>
      <div style="font-size:13px;color:var(--text2)">Receive email updates when incidents occur or resolve.</div>
    </div>
    <form id="subscribe-form" style="display:flex;gap:8px;max-width:420px">
      <input type="email" id="sub-email" class="sub-input" placeholder="you@company.com" required />
      <button type="submit" class="sub-btn" style="background:${brand}">Notify me</button>
    </form>
    <p id="subscribe-msg" style="font-size:12px;margin-top:8px;min-height:18px"></p>
  </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${pageName} — Status</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{
      --bg:#0a0a0f;--surface:#111118;--card:#16161f;--border:#1e1e2a;
      --text:#f0f0f5;--text2:#9090a8;--text3:#55556a;
      --bar-empty:#1e1e2a;
      --brand:${brand};
    }
    [data-theme="light"]{
      --bg:#f5f5f8;--surface:#fff;--card:#fff;--border:#e4e4ec;
      --text:#0f0f18;--text2:#5a5a72;--text3:#9090a8;
      --bar-empty:#e4e4ec;
    }
    html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
    body{background:var(--bg);color:var(--text);font-family:'Inter',system-ui,sans-serif;line-height:1.5;min-height:100vh}

    /* Top stripe */
    .top-stripe{height:3px;width:100%;background:${statusColor};position:sticky;top:0;z-index:10}

    .wrap{max-width:700px;margin:0 auto;padding:40px 20px 80px}

    /* Nav */
    .nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:48px}
    .nav-brand{display:flex;align-items:center;gap:10px}
    .nav-logo{height:26px;border-radius:4px}
    .nav-name{font-size:16px;font-weight:700;letter-spacing:-0.02em}
    .nav-right{display:flex;align-items:center;gap:10px}
    .live-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--text3);font-weight:500}
    .live-badge::before{content:'';width:6px;height:6px;border-radius:50%;background:#22c55e;flex-shrink:0;animation:blink 2.4s ease-in-out infinite}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}
    .theme-toggle{background:var(--surface);border:1px solid var(--border);border-radius:7px;color:var(--text2);cursor:pointer;padding:5px 11px;font-size:12px;font-weight:500;font-family:inherit;transition:border-color .15s,color .15s;line-height:1.5}
    .theme-toggle:hover{border-color:var(--text3);color:var(--text)}

    /* Hero */
    .hero{padding:28px 28px 24px;border-radius:14px;border:1px solid var(--border);background:var(--surface);margin-bottom:40px;position:relative;overflow:hidden}
    .hero::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,${statusColor}0a 0%,transparent 60%);pointer-events:none}
    .hero-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;margin-bottom:14px;background:${statusColor}18;color:${statusColor}}
    .hero-title{font-size:22px;font-weight:700;letter-spacing:-0.03em;color:${statusColor};margin-bottom:4px}
    .hero-sub{font-size:13px;color:var(--text3)}

    /* Section */
    .section{margin-top:44px}
    .section-header{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:14px;display:flex;align-items:center;gap:8px}

    /* Monitor card */
    .monitor-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px 20px;margin-bottom:10px;transition:border-color .15s}
    .monitor-card:hover{border-color:var(--text3)}
    .monitor-row{display:flex;justify-content:space-between;align-items:center;gap:12px}
    .monitor-name{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .status-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
    .monitor-pill{font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;white-space:nowrap;flex-shrink:0}

    /* Incident card */
    .incident-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px 20px;margin-bottom:10px}
    .timeline-row{display:flex;gap:12px}

    /* Empty */
    .empty-state{font-size:13px;color:var(--text3);padding:20px 0}

    /* Subscribe */
    .subscribe-box{margin-top:48px;padding:24px;background:var(--card);border:1px solid var(--border);border-radius:12px}
    .sub-input{flex:1;padding:9px 13px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);font-size:13px;font-family:inherit;outline:none;transition:border-color .15s;min-width:0}
    .sub-input:focus{border-color:var(--brand)}
    .sub-input::placeholder{color:var(--text3)}
    .sub-btn{padding:9px 18px;border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;opacity:.9;transition:opacity .15s;white-space:nowrap}
    .sub-btn:hover{opacity:1}

    /* Footer */
    .footer{margin-top:56px;padding-top:20px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--text3)}
    .footer a{color:var(--text3);text-decoration:none}
    .footer a:hover{color:var(--text2)}

    @media(max-width:600px){
      .wrap{padding:28px 16px 60px}
      .monitor-row{flex-wrap:wrap;gap:8px}
      .subscribe-box form{flex-direction:column}
      .footer{flex-direction:column;gap:8px;text-align:center}
    }
  </style>
</head>
<body>
  <div class="top-stripe"></div>
  <div class="wrap">

    <nav class="nav">
      <div class="nav-brand">
        ${logoUrl ? `<img src="${logoUrl}" alt="" class="nav-logo">` : ''}
        <span class="nav-name">${pageName}</span>
      </div>
      <div class="nav-right">
        <span class="live-badge" id="live-label">Live</span>
        <button class="theme-toggle" onclick="toggleTheme()" id="theme-btn">Light</button>
      </div>
    </nav>

    <div class="hero">
      <div class="hero-icon">${statusEmoji}</div>
      <div class="hero-title">${statusLabel}</div>
      <div class="hero-sub">Last updated ${timeAgo(data.generatedAt)}</div>
    </div>

    <section>
      <div class="section-header">Services</div>
      ${monitorsHtml}
    </section>

    ${activeIncidentsHtml}
    ${resolvedIncidentsHtml}
    ${subscribeHtml}

    <div class="footer">
      <span>&copy; ${new Date().getFullYear()} ${pageName}</span>
      <a href="https://uptimecrow.com" target="_blank" rel="noopener">Powered by UptimeCrow</a>
    </div>
  </div>

  <script>
  (function(){
    var s=localStorage.getItem('uc-theme'),dark=window.matchMedia('(prefers-color-scheme:dark)').matches,t=s||(dark?'dark':'light');
    document.documentElement.setAttribute('data-theme',t);
    setBtn(t);
    function setBtn(t){var b=document.getElementById('theme-btn');if(b)b.textContent=t==='dark'?'Light':'Dark';}
    window.toggleTheme=function(){
      var c=document.documentElement.getAttribute('data-theme')||'dark',n=c==='dark'?'light':'dark';
      document.documentElement.setAttribute('data-theme',n);localStorage.setItem('uc-theme',n);setBtn(n);
    };
    var secs=60,lbl=document.getElementById('live-label');
    setInterval(function(){secs--;if(lbl)lbl.textContent='Refreshes in '+secs+'s';if(secs<=0){secs=60;}},1000);
    setTimeout(function(){location.reload();},60000);
  })();
  ${data.subscribeEndpoint ? `
  (function(){
    var form=document.getElementById('subscribe-form'),msg=document.getElementById('subscribe-msg');
    if(!form)return;
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var email=document.getElementById('sub-email').value;
      msg.textContent='Subscribing\u2026';msg.style.color='var(--text2)';
      fetch('${data.subscribeEndpoint}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email})})
        .then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d}})})
        .then(function(r){msg.textContent=r.d.message||'Subscribed!';msg.style.color=r.ok?'#22c55e':'#ef4444';if(r.ok)form.reset();})
        .catch(function(){msg.textContent='Something went wrong.';msg.style.color='#ef4444';});
    });
  })();` : ''}
  </script>
</body>
</html>`;
}
