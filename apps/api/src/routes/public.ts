import { Hono } from "hono";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  statusPages,
  statusPageMonitors,
  monitors,
  incidents,
  incidentUpdates,
  subscribers,
  checkResults,
} from "../db/schema.js";
import { subscribeSchema } from "@uptimecrow/shared";
import { renderStatusHtml, type StaticStatusPage } from "../services/static-gen.service.js";
import { escapeHtml } from "../utils/escape.js";
import { makeQueue } from "../utils/queues.js";

export const publicRoutes = new Hono();

const notifyQueue = makeQueue("notifications");

// Get status page data
publicRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const token = c.req.query("token");

  const [page] = await db
    .select()
    .from(statusPages)
    .where(eq(statusPages.slug, slug))
    .limit(1);

  if (!page) {
    return c.json({ error: "Status page not found" }, 404);
  }

  if (!page.isPublic) {
    if (!token || token !== page.accessToken) {
      return c.json({ error: "Status page not found" }, 404);
    }
  }

  // Get monitors linked to this status page (fall back to all org monitors if none linked)
  const linkedMonitorIds = await db
    .select({ monitorId: statusPageMonitors.monitorId })
    .from(statusPageMonitors)
    .where(eq(statusPageMonitors.statusPageId, page.id));

  let orgMonitors;
  if (linkedMonitorIds.length > 0) {
    const ids = linkedMonitorIds.map((l) => l.monitorId);
    orgMonitors = await db
      .select({
        id: monitors.id,
        name: monitors.name,
        status: monitors.status,
        lastCheckedAt: monitors.lastCheckedAt,
        lastResponseMs: monitors.lastResponseMs,
      })
      .from(monitors)
      .where(and(eq(monitors.isActive, true), inArray(monitors.id, ids)));
  } else {
    // Fallback: show all org monitors if none specifically linked
    orgMonitors = await db
      .select({
        id: monitors.id,
        name: monitors.name,
        status: monitors.status,
        lastCheckedAt: monitors.lastCheckedAt,
        lastResponseMs: monitors.lastResponseMs,
      })
      .from(monitors)
      .where(and(eq(monitors.orgId, page.orgId), eq(monitors.isActive, true)));
  }

  // Get active incidents
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

  const data = {
    statusPage: {
      name: page.name,
      slug: page.slug,
      logoUrl: page.logoUrl,
      brandColor: page.brandColor,
    },
    monitors: orgMonitors,
    activeIncidents,
  };

  // Return HTML for browser requests, JSON for API requests
  const accept = c.req.header("Accept") || "";
  if (accept.includes("text/html")) {
    // Calculate per-monitor uptime + daily data + response times
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const monitorsWithUptime = await Promise.all(
      orgMonitors.map(async (m) => {
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

        // Daily uptime for last 90 days
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

        // Build 90-day array (fill missing days as null)
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
          dailyUptime,
          recentResponseMs,
        };
      }),
    );

    // Fetch incidents with updates for HTML
    const incidentsWithUpdates = await Promise.all(
      activeIncidents.map(async (inc) => {
        const updates = await db
          .select({
            status: incidentUpdates.status,
            body: incidentUpdates.body,
            createdAt: incidentUpdates.createdAt,
          })
          .from(incidentUpdates)
          .where(eq(incidentUpdates.incidentId, inc.id))
          .orderBy(desc(incidentUpdates.createdAt));
        return {
          id: inc.id,
          title: inc.title,
          status: inc.status,
          severity: inc.severity,
          startedAt: inc.startedAt.toISOString(),
          updates: updates.map((u) => ({
            status: u.status,
            body: u.body,
            createdAt: u.createdAt.toISOString(),
          })),
        };
      }),
    );

    // Recent resolved incidents
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
      recentResolved.map(async (inc) => {
        const updates = await db
          .select({
            status: incidentUpdates.status,
            body: incidentUpdates.body,
            createdAt: incidentUpdates.createdAt,
          })
          .from(incidentUpdates)
          .where(eq(incidentUpdates.incidentId, inc.id))
          .orderBy(desc(incidentUpdates.createdAt));
        return {
          id: inc.id,
          title: inc.title,
          status: inc.status,
          severity: inc.severity,
          startedAt: inc.startedAt.toISOString(),
          resolvedAt: inc.resolvedAt?.toISOString() ?? null,
          updates: updates.map((u) => ({
            status: u.status,
            body: u.body,
            createdAt: u.createdAt.toISOString(),
          })),
        };
      }),
    );

    const staticData: StaticStatusPage = {
      generatedAt: new Date().toISOString(),
      statusPage: data.statusPage,
      overallStatus: (orgMonitors.some((m) => m.status === "down")
        ? "major_outage"
        : orgMonitors.some((m) => m.status === "degraded")
          ? "degraded"
          : "operational") as "operational" | "degraded" | "major_outage",
      monitors: monitorsWithUptime,
      activeIncidents: incidentsWithUpdates,
      resolvedIncidents: resolvedWithUpdates,
      subscribeEndpoint: `/status/${slug}/subscribe`,
    };
    const html = renderStatusHtml(staticData);
    c.header("Content-Type", "text/html; charset=UTF-8");
    return c.body(html);
  }

  return c.json(data);
});

// Get incident history
publicRoutes.get("/:slug/incidents", async (c) => {
  const slug = c.req.param("slug");
  const limit = parseInt(c.req.query("limit") || "20", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);
  const token = c.req.query("token");

  const [page] = await db
    .select({ id: statusPages.id, isPublic: statusPages.isPublic, accessToken: statusPages.accessToken })
    .from(statusPages)
    .where(eq(statusPages.slug, slug))
    .limit(1);

  if (!page) {
    return c.json({ error: "Status page not found" }, 404);
  }

  if (!page.isPublic) {
    if (!token || token !== page.accessToken) {
      return c.json({ error: "Status page not found" }, 404);
    }
  }

  const result = await db
    .select()
    .from(incidents)
    .where(eq(incidents.statusPageId, page.id))
    .orderBy(desc(incidents.startedAt))
    .limit(limit)
    .offset(offset);

  // Get updates for each incident
  const incidentsWithUpdates = await Promise.all(
    result.map(async (incident) => {
      const updates = await db
        .select()
        .from(incidentUpdates)
        .where(eq(incidentUpdates.incidentId, incident.id))
        .orderBy(desc(incidentUpdates.createdAt));
      return { ...incident, updates };
    }),
  );

  return c.json({ incidents: incidentsWithUpdates });
});

// RSS feed for incidents
publicRoutes.get("/:slug/rss", async (c) => {
  const slug = c.req.param("slug");
  const token = c.req.query("token");

  const [page] = await db
    .select({
      id: statusPages.id,
      name: statusPages.name,
      slug: statusPages.slug,
      isPublic: statusPages.isPublic,
      accessToken: statusPages.accessToken,
    })
    .from(statusPages)
    .where(eq(statusPages.slug, slug))
    .limit(1);

  if (!page) return c.text("Status page not found", 404);
  if (!page.isPublic && (!token || token !== page.accessToken)) {
    return c.text("Status page not found", 404);
  }

  const rows = await db
    .select()
    .from(incidents)
    .where(eq(incidents.statusPageId, page.id))
    .orderBy(desc(incidents.startedAt))
    .limit(50);

  const appUrl = process.env.APP_URL || "http://localhost:5173";
  const feedUrl = `${appUrl}/status/${slug}/rss`;
  const pageUrl = `${appUrl}/status/${slug}`;

  const items = await Promise.all(rows.map(async (inc) => {
    // Latest update body (fall back to title)
    const [latest] = await db
      .select({ body: incidentUpdates.body, createdAt: incidentUpdates.createdAt })
      .from(incidentUpdates)
      .where(eq(incidentUpdates.incidentId, inc.id))
      .orderBy(desc(incidentUpdates.createdAt))
      .limit(1);

    const description = latest?.body ?? `${inc.severity} incident: ${inc.title}`;
    const pubDate = (latest?.createdAt ?? inc.startedAt).toUTCString();

    return `    <item>
      <title>${escapeHtml(inc.title)}</title>
      <link>${pageUrl}#incident-${inc.id}</link>
      <guid isPermaLink="false">${inc.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${inc.severity}</category>
      <description>${escapeHtml(description)}</description>
    </item>`;
  }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(page.name)} — Incident feed</title>
    <link>${pageUrl}</link>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <description>Incident history and updates for ${escapeHtml(page.name)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>`;

  c.header("Content-Type", "application/rss+xml; charset=UTF-8");
  c.header("Cache-Control", "public, max-age=300");
  return c.body(xml);
});

// Subscribe to status page
publicRoutes.post("/:slug/subscribe", async (c) => {
  const slug = c.req.param("slug");
  const body = await c.req.json();
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const token = c.req.query("token");

  const [page] = await db
    .select({ id: statusPages.id, isPublic: statusPages.isPublic, accessToken: statusPages.accessToken })
    .from(statusPages)
    .where(eq(statusPages.slug, slug))
    .limit(1);

  if (!page) {
    return c.json({ error: "Status page not found" }, 404);
  }

  if (!page.isPublic) {
    if (!token || token !== page.accessToken) {
      return c.json({ error: "Status page not found" }, 404);
    }
  }

  // Check if already subscribed
  const existing = await db
    .select({ id: subscribers.id })
    .from(subscribers)
    .where(
      and(
        eq(subscribers.statusPageId, page.id),
        eq(subscribers.email, parsed.data.email),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return c.json({ message: "Already subscribed" });
  }

  const [newSub] = await db
    .insert(subscribers)
    .values({
      statusPageId: page.id,
      email: parsed.data.email,
      webhookUrl: parsed.data.webhookUrl || null,
    })
    .returning();

  // Queue verification email
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  await notifyQueue.add("verification", {
    type: "verification",
    statusPageId: page.id,
    email: parsed.data.email,
    verifyUrl: `${appUrl}/status/verify/${newSub.unsubscribeToken}`,
  });

  return c.json({ message: "Subscribed. Check your email to verify." }, 201);
});

// Verify subscription
publicRoutes.get("/verify/:token", async (c) => {
  const token = c.req.param("token");

  const [subscriber] = await db
    .update(subscribers)
    .set({ isVerified: true })
    .where(eq(subscribers.unsubscribeToken, token))
    .returning({ statusPageId: subscribers.statusPageId });

  if (!subscriber) {
    c.header("Content-Type", "text/html; charset=UTF-8");
    return c.body(confirmationPage("Invalid link", "This verification link is invalid or has already been used.", false, null));
  }

  const [page] = await db
    .select({ name: statusPages.name, slug: statusPages.slug })
    .from(statusPages)
    .where(eq(statusPages.id, subscriber.statusPageId))
    .limit(1);

  c.header("Content-Type", "text/html; charset=UTF-8");
  return c.body(confirmationPage(
    "You're subscribed!",
    `You'll receive email updates when incidents are created or resolved for <strong>${escapeHtml(page?.name ?? "this status page")}</strong>.`,
    true,
    page?.slug ?? null,
  ));
});

// Unsubscribe
publicRoutes.get("/unsubscribe/:token", async (c) => {
  const token = c.req.param("token");

  const [subscriber] = await db
    .delete(subscribers)
    .where(eq(subscribers.unsubscribeToken, token))
    .returning({ statusPageId: subscribers.statusPageId });

  if (!subscriber) {
    c.header("Content-Type", "text/html; charset=UTF-8");
    return c.body(confirmationPage("Invalid link", "This unsubscribe link is invalid or has already been used.", false, null));
  }

  const [page] = await db
    .select({ name: statusPages.name, slug: statusPages.slug })
    .from(statusPages)
    .where(eq(statusPages.id, subscriber.statusPageId))
    .limit(1);

  c.header("Content-Type", "text/html; charset=UTF-8");
  return c.body(confirmationPage(
    "Unsubscribed",
    `You've been removed from <strong>${escapeHtml(page?.name ?? "this status page")}</strong> notifications.`,
    false,
    page?.slug ?? null,
  ));
});

function confirmationPage(title: string, message: string, success: boolean, slug: string | null): string {
  const icon = success ? "✓" : "✕";
  const iconColor = success ? "#22c55e" : "#ef4444";
  const statusLink = slug
    ? `<a href="/status/${slug}" style="display:inline-block;margin-top:24px;padding:10px 22px;background:#18181f;border:1px solid #2a2a38;border-radius:8px;color:#9090a8;text-decoration:none;font-size:13px;font-weight:500">← Back to status page</a>`
    : `<a href="/" style="display:inline-block;margin-top:24px;padding:10px 22px;background:#18181f;border:1px solid #2a2a38;border-radius:8px;color:#9090a8;text-decoration:none;font-size:13px;font-weight:500">← UptimeCrow</a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — UptimeCrow</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0a0a0f;color:#f0f0f5;font-family:'Inter',system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;-webkit-font-smoothing:antialiased}
    .card{background:#111118;border:1px solid #1e1e2a;border-radius:16px;padding:48px 40px;max-width:420px;width:100%;text-align:center}
    .icon{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;margin:0 auto 24px;background:${iconColor}18;color:${iconColor}}
    h1{font-size:20px;font-weight:600;letter-spacing:-0.02em;margin-bottom:12px}
    p{font-size:14px;color:#9090a8;line-height:1.6}
    p strong{color:#c0c0d0;font-weight:500}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    ${statusLink}
  </div>
</body>
</html>`;
}

// Uptime badge SVG
publicRoutes.get("/badge/:slug", async (c) => {
  const rawSlug = c.req.param("slug");
  const slug = rawSlug.endsWith(".svg") ? rawSlug.slice(0, -4) : rawSlug;

  const [page] = await db
    .select({
      id: statusPages.id,
      orgId: statusPages.orgId,
      isPublic: statusPages.isPublic,
      accessToken: statusPages.accessToken,
    })
    .from(statusPages)
    .where(eq(statusPages.slug, slug))
    .limit(1);

  if (!page) {
    return c.text("Not found", 404);
  }

  // Private pages must not leak uptime to anyone who guesses the slug — require
  // the access token, matching the other private status-page routes.
  if (!page.isPublic) {
    const token = c.req.query("token");
    if (!token || token !== page.accessToken) {
      return svgBadge(c, "uptime", "N/A", "#999");
    }
  }

  // Calculate uptime from last 30 days of check results
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const orgMonitorIds = await db
    .select({ id: monitors.id })
    .from(monitors)
    .where(and(eq(monitors.orgId, page.orgId), eq(monitors.isActive, true)));

  if (orgMonitorIds.length === 0) {
    return svgBadge(c, "uptime", "N/A", "#999");
  }

  const monitorIds = orgMonitorIds.map((m) => m.id);

  const stats = await db
    .select({
      total: sql<number>`count(*)`,
      up: sql<number>`count(*) filter (where ${checkResults.status} = 'up')`,
    })
    .from(checkResults)
    .where(
      and(
        sql`${checkResults.monitorId} = ANY(${monitorIds})`,
        sql`${checkResults.checkedAt} > ${thirtyDaysAgo.toISOString()}`,
      ),
    );

  const total = Number(stats[0]?.total || 0);
  const up = Number(stats[0]?.up || 0);
  const uptime = total > 0 ? ((up / total) * 100).toFixed(2) : "N/A";

  const color = uptime === "N/A" ? "#999" : parseFloat(uptime) >= 99 ? "#00e676" : parseFloat(uptime) >= 95 ? "#ffab40" : "#ff5252";

  return svgBadge(c, "uptime", `${uptime}%`, color);
});

function svgBadge(c: any, label: string, value: string, color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="20" viewBox="0 0 140 20">
  <rect width="60" height="20" rx="3" fill="#555"/>
  <rect x="60" width="80" height="20" rx="3" fill="${color}"/>
  <rect width="140" height="20" rx="3" fill="url(#g)"/>
  <defs><linearGradient id="g" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient></defs>
  <text x="30" y="14" fill="#fff" text-anchor="middle" font-family="Verdana,sans-serif" font-size="11">${label}</text>
  <text x="100" y="14" fill="#fff" text-anchor="middle" font-family="Verdana,sans-serif" font-size="11" font-weight="bold">${value}</text>
</svg>`;

  c.header("Content-Type", "image/svg+xml");
  c.header("Cache-Control", "public, max-age=300");
  return c.body(svg);
}
