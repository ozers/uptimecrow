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
  const brand = data.statusPage.brandColor;
  const statusColor =
    data.overallStatus === "operational" ? "#00e676"
      : data.overallStatus === "degraded" ? "#ffab40"
      : "#ff5252";
  const statusLabel =
    data.overallStatus === "operational" ? "All Systems Operational"
      : data.overallStatus === "degraded" ? "Degraded Performance"
      : "Major Outage";
  const statusIcon =
    data.overallStatus === "operational" ? "&#10003;"
      : data.overallStatus === "degraded" ? "&#9888;"
      : "&#10007;";

  function dotColor(status: string) {
    return status === "up" ? "#00e676" : status === "down" ? "#ff5252" : status === "degraded" ? "#ffab40" : "#666";
  }
  function statusText(status: string) {
    return status === "up" ? "Operational" : status === "down" ? "Down" : status === "degraded" ? "Degraded" : "Unknown";
  }
  function severityBg(sev: string, dark: boolean) {
    if (dark) return sev === "critical" ? "rgba(255,82,82,0.15)" : sev === "major" ? "rgba(255,171,64,0.15)" : "rgba(255,213,79,0.15)";
    return sev === "critical" ? "#fee2e2" : sev === "major" ? "#ffedd5" : "#fef9c3";
  }
  function severityColor(sev: string) {
    return sev === "critical" ? "#ff5252" : sev === "major" ? "#ffab40" : "#ffd54f";
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

  function renderUptimeBar(daily: Array<{ date: string; percent: number | null; total: number }>) {
    if (!daily || daily.length === 0) return '';
    const barWidth = 680;
    const gap = 1.5;
    const count = daily.length;
    const slotW = (barWidth - (count - 1) * gap) / count;
    const h = 32;
    const rects = daily.map((d, i) => {
      const x = i * (slotW + gap);
      let fill: string;
      if (d.total === 0) fill = "var(--bar-empty)";
      else if (d.percent !== null && d.percent >= 99.5) fill = "#00e676";
      else if (d.percent !== null && d.percent >= 95) fill = "#ffab40";
      else fill = "#ff5252";
      const title = d.total === 0 ? `${d.date}: No data` : `${d.date}: ${d.percent?.toFixed(1)}% uptime (${d.total} checks)`;
      return `<rect x="${x}" y="0" width="${slotW}" height="${h}" rx="2" fill="${fill}" class="bar-slot"><title>${title}</title></rect>`;
    }).join("");
    return `<svg width="100%" viewBox="0 0 ${barWidth} ${h}" preserveAspectRatio="none" class="uptime-bar">${rects}</svg>`;
  }

  function renderSparkline(values: number[]) {
    if (!values || values.length < 2) return '';
    const w = 200, h = 40, pad = 2;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const points = values.map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    }).join(" ");
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    return `<div class="sparkline-wrap">
      <svg width="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="sparkline">
        <polyline points="${points}" fill="none" stroke="${brand}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
      </svg>
      <span class="sparkline-avg">${avg}ms avg</span>
    </div>`;
  }

  const monitorsHtml = data.monitors.map((m) => {
    const uptimeBar = renderUptimeBar(m.dailyUptime ?? []);
    const sparkline = renderSparkline(m.recentResponseMs ?? []);
    const uptimeColor = !m.uptimePercent ? 'var(--text3)' : parseFloat(m.uptimePercent) >= 99.9 ? '#00e676' : parseFloat(m.uptimePercent) >= 99 ? '#ffab40' : '#ff5252';
    return `
    <div class="monitor-block">
      <div class="monitor-top">
        <div class="monitor-info">
          <span class="monitor-dot" style="background:${dotColor(m.status)};box-shadow:0 0 8px ${dotColor(m.status)}40;"></span>
          <span class="monitor-name">${m.name}</span>
          <span class="monitor-status" style="color:${dotColor(m.status)}">${statusText(m.status)}</span>
        </div>
        <div class="monitor-right">
          <span class="uptime-pct" style="color:${uptimeColor}">${m.uptimePercent ? m.uptimePercent + '%' : '—'}</span>
          ${m.lastCheckedAt ? `<span class="last-check">${timeAgo(m.lastCheckedAt)}</span>` : ''}
        </div>
      </div>
      ${uptimeBar ? `<div class="bar-container">
        <div class="bar-labels"><span>30 days ago</span><span>Today</span></div>
        ${uptimeBar}
      </div>` : ''}
      ${sparkline ? `<div class="sparkline-container">
        <span class="sparkline-label">Response time</span>
        ${sparkline}
      </div>` : ''}
    </div>`;
  }).join("");

  function renderIncident(inc: { title: string; status: string; severity: string; startedAt: string; updates: Array<{ status: string; body: string; createdAt: string }> }, showUpdates = true) {
    const incidentStatusColors: Record<string, string> = {
      investigating: "#ff5252", identified: "#ffab40", monitoring: "#ffd54f", resolved: "#00e676",
    };
    return `<div class="incident-card">
      <div class="incident-header">
        <div class="incident-title-row">
          <span class="incident-dot" style="background:${incidentStatusColors[inc.status] || '#666'}"></span>
          <strong class="incident-title">${inc.title}</strong>
        </div>
        <span class="severity-badge" style="background:${severityBg(inc.severity, true)};color:${severityColor(inc.severity)}">${inc.severity}</span>
      </div>
      <div class="incident-meta">
        <span class="incident-status">${inc.status}</span>
        <span class="incident-time">${timeAgo(inc.startedAt)}</span>
      </div>
      ${showUpdates && inc.updates.length > 0 ? `<div class="incident-timeline">${inc.updates.map((u) => `
        <div class="timeline-entry">
          <div class="timeline-dot" style="background:${incidentStatusColors[u.status] || '#666'}"></div>
          <div class="timeline-content">
            <div class="timeline-head">
              <span class="timeline-status">${u.status}</span>
              <span class="timeline-time">${timeAgo(u.createdAt)}</span>
            </div>
            <p class="timeline-body">${u.body}</p>
          </div>
        </div>`).join("")}</div>` : ''}
    </div>`;
  }

  const activeIncidentsHtml = data.activeIncidents.length > 0
    ? `<section class="section">
        <h2 class="section-title"><span class="section-icon" style="color:#ff5252">&#9888;</span> Active Incidents</h2>
        ${data.activeIncidents.map((inc) => renderIncident(inc)).join("")}
      </section>` : '';

  const resolvedIncidentsHtml = data.resolvedIncidents && data.resolvedIncidents.length > 0
    ? `<section class="section">
        <h2 class="section-title">Past Incidents</h2>
        ${data.resolvedIncidents.map((inc) => renderIncident(inc, false)).join("")}
      </section>` : '';

  const subscribeHtml = data.subscribeEndpoint
    ? `<section class="subscribe-section">
        <h3 class="subscribe-title">Get notified</h3>
        <p class="subscribe-desc">Subscribe to receive updates when incidents are created or resolved.</p>
        <form class="subscribe-form" id="subscribe-form">
          <input type="email" class="subscribe-input" placeholder="you@company.com" required id="sub-email" />
          <button type="submit" class="subscribe-btn" style="background:${brand}">Subscribe</button>
        </form>
        <p class="subscribe-msg" id="subscribe-msg"></p>
      </section>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>${data.statusPage.name} — Status</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{
      --bg:#07070b;--surface:#0d0d14;--card:#12121a;--border:#22222e;
      --text:#eeeef2;--text2:#8b8b9a;--text3:#5a5a70;
      --bar-empty:#22222e;
      --card-shadow:none;
      --brand:${brand};
    }
    [data-theme="light"]{
      --bg:#f4f5f7;--surface:#fff;--card:#fff;--border:#e2e4e9;
      --text:#111827;--text2:#4b5563;--text3:#6b7280;
      --bar-empty:#e2e4e9;
      --card-shadow:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);
    }
    body{background:var(--bg);color:var(--text);font-family:'Sora',system-ui,sans-serif;line-height:1.5;-webkit-font-smoothing:antialiased}
    .container{max-width:680px;margin:0 auto;padding:48px 20px 80px}

    /* Header */
    .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:40px}
    .header-left{display:flex;align-items:center;gap:12px}
    .header-logo{height:28px}
    .header-name{font-size:20px;font-weight:700;letter-spacing:-0.02em}
    .header-right{display:flex;align-items:center;gap:12px}
    .theme-btn{background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--text2);cursor:pointer;padding:5px 10px;font-size:12px;font-weight:500;font-family:inherit;letter-spacing:.01em;transition:all .2s;line-height:1.5}
    .theme-btn:hover{border-color:var(--text3);color:var(--text)}
    .live-dot{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--text3)}
    .live-dot::before{content:'';width:6px;height:6px;border-radius:50%;background:#00e676;flex-shrink:0;animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

    /* Status Banner */
    .status-banner{border-radius:12px;padding:20px 24px;margin-bottom:36px;display:flex;align-items:center;gap:12px;border:1px solid}
    .status-icon{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;flex-shrink:0}
    .status-text h2{font-size:16px;font-weight:600;letter-spacing:-0.01em}
    .status-text p{font-size:13px;margin-top:2px}

    /* Monitors */
    .monitors-header{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:16px}
    .monitor-block{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px 20px;margin-bottom:12px;box-shadow:var(--card-shadow);transition:border-color .2s}
    .monitor-block:hover{border-color:var(--text3)}
    .monitor-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
    .monitor-info{display:flex;align-items:center;gap:10px}
    .monitor-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
    .monitor-name{font-size:14px;font-weight:600}
    .monitor-status{font-size:12px;margin-left:4px}
    .monitor-right{display:flex;align-items:center;gap:14px;text-align:right}
    .uptime-pct{font-size:15px;font-weight:700;font-variant-numeric:tabular-nums}
    .last-check{font-size:11px;color:var(--text3)}
    .bar-container{margin-bottom:10px}
    .bar-labels{display:flex;justify-content:space-between;font-size:10px;color:var(--text3);margin-bottom:6px}
    .uptime-bar{display:block;border-radius:4px;overflow:hidden}
    .bar-slot{transition:opacity .15s}
    .bar-slot:hover{opacity:.8}
    .sparkline-container{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:10px;border-top:1px solid var(--border)}
    .sparkline-label{font-size:11px;color:var(--text3);white-space:nowrap}
    .sparkline-wrap{display:flex;align-items:center;gap:10px;flex:1;justify-content:flex-end}
    .sparkline{max-width:200px;height:36px;flex-shrink:0}
    .sparkline-avg{font-size:12px;font-weight:600;color:var(--text2);white-space:nowrap;font-variant-numeric:tabular-nums}

    /* Sections */
    .section{margin-top:40px}
    .section-title{font-size:15px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px}
    .section-icon{font-size:16px}

    /* Incidents */
    .incident-card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px 18px;margin-bottom:10px;box-shadow:var(--card-shadow)}
    .incident-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
    .incident-title-row{display:flex;align-items:center;gap:8px}
    .incident-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:1px}
    .incident-title{font-size:14px;font-weight:600}
    .severity-badge{font-size:11px;font-weight:600;padding:2px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:.04em;flex-shrink:0}
    .incident-meta{display:flex;gap:12px;margin-top:8px;font-size:12px}
    .incident-status{color:var(--text2);text-transform:capitalize}
    .incident-time{color:var(--text3)}

    /* Timeline */
    .incident-timeline{margin-top:14px;padding-top:14px;border-top:1px solid var(--border)}
    .timeline-entry{display:flex;gap:12px;padding-bottom:14px;position:relative}
    .timeline-entry:last-child{padding-bottom:0}
    .timeline-entry:not(:last-child)::after{content:'';position:absolute;left:4px;top:14px;bottom:0;width:1px;background:var(--border)}
    .timeline-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;margin-top:4px}
    .timeline-content{flex:1}
    .timeline-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
    .timeline-status{font-size:12px;font-weight:600;text-transform:capitalize;color:var(--text2)}
    .timeline-time{font-size:11px;color:var(--text3)}
    .timeline-body{font-size:13px;color:var(--text2);line-height:1.6}

    /* Subscribe */
    .subscribe-section{margin-top:48px;padding:24px;background:var(--card);border:1px solid var(--border);border-radius:12px;text-align:center;box-shadow:var(--card-shadow)}
    .subscribe-title{font-size:15px;font-weight:600;margin-bottom:4px}
    .subscribe-desc{font-size:13px;color:var(--text2);margin-bottom:16px}
    .subscribe-form{display:flex;gap:8px;max-width:400px;margin:0 auto}
    .subscribe-input{flex:1;padding:10px 14px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);font-size:14px;font-family:inherit;outline:none;transition:border-color .2s}
    .subscribe-input:focus{border-color:var(--brand)}
    .subscribe-input::placeholder{color:var(--text3)}
    .subscribe-btn{padding:10px 20px;border:none;border-radius:8px;color:#000;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;transition:opacity .2s;white-space:nowrap}
    .subscribe-btn:hover{opacity:.85}
    .subscribe-msg{font-size:13px;margin-top:8px;min-height:20px}
    .subscribe-msg.ok{color:#00e676}
    .subscribe-msg.err{color:#ff5252}

    /* Footer */
    .footer{margin-top:48px;padding-top:20px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--text3)}
    .footer a{color:var(--text3);text-decoration:none;transition:color .2s}
    .footer a:hover{color:var(--text2)}

    @media(max-width:600px){
      .container{padding:24px 16px 60px}
      .subscribe-form{flex-direction:column}
      .monitor-card{flex-direction:column;align-items:flex-start;gap:8px}
      .monitor-meta{width:100%;justify-content:space-between}
      .footer{flex-direction:column;gap:8px;text-align:center}
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-left">
        ${data.statusPage.logoUrl ? `<img src="${data.statusPage.logoUrl}" alt="${data.statusPage.name}" class="header-logo" />` : ''}
        <span class="header-name">${data.statusPage.name}</span>
      </div>
      <div class="header-right">
        <span class="live-dot" id="live-label">Live</span>
        <button class="theme-btn" onclick="toggleTheme()" id="theme-btn" aria-label="Toggle theme">Dark</button>
      </div>
    </div>

    <div class="status-banner" style="background:${statusColor}0d;border-color:${statusColor}30">
      <div class="status-icon" style="background:${statusColor}1a;color:${statusColor}">${statusIcon}</div>
      <div class="status-text">
        <h2 style="color:${statusColor}">${statusLabel}</h2>
        <p style="color:var(--text2)">Last updated ${timeAgo(data.generatedAt)}</p>
      </div>
    </div>

    <div class="monitors-header">Services</div>
    ${monitorsHtml}

    ${activeIncidentsHtml}
    ${resolvedIncidentsHtml}
    ${subscribeHtml}

    <div class="footer">
      <span>&copy; ${new Date().getFullYear()} ${data.statusPage.name}</span>
      <a href="https://uptimecrow.com" target="_blank">Powered by UptimeCrow</a>
    </div>
  </div>

  <script>
    (function(){
      // Theme
      var s=localStorage.getItem('uc-theme'),d=window.matchMedia('(prefers-color-scheme:dark)').matches,t=s||(d?'dark':'light');
      document.documentElement.setAttribute('data-theme',t);u(t);
      function u(t){var b=document.getElementById('theme-btn');if(b)b.textContent=t==='dark'?'Light':'Dark';}
      window.toggleTheme=function(){var c=document.documentElement.getAttribute('data-theme')||'dark',n=c==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',n);localStorage.setItem('uc-theme',n);u(n);};
      // Auto-refresh every 60s
      setTimeout(function(){location.reload();},60000);
      // Live label countdown
      var secs=60,lbl=document.getElementById('live-label');
      setInterval(function(){secs--;if(lbl)lbl.textContent='Refreshes in '+secs+'s';if(secs<=0)secs=60;},1000);
    })();
    ${data.subscribeEndpoint ? `
    (function(){
      var form=document.getElementById('subscribe-form'),msg=document.getElementById('subscribe-msg');
      if(!form)return;
      form.addEventListener('submit',function(e){
        e.preventDefault();
        var email=document.getElementById('sub-email').value;
        msg.textContent='Subscribing...';msg.className='subscribe-msg';
        fetch('${data.subscribeEndpoint}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email})})
          .then(function(r){return r.json().then(function(d){return{ok:r.ok,data:d}})})
          .then(function(r){msg.textContent=r.data.message||'Subscribed!';msg.className='subscribe-msg '+(r.ok?'ok':'err');if(r.ok)form.reset()})
          .catch(function(){msg.textContent='Something went wrong.';msg.className='subscribe-msg err'});
      });
    })();` : ''}
  </script>
</body>
</html>`;
}
