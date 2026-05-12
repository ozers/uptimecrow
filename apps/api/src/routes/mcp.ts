// MCP (Model Context Protocol) Server — exposes UptimeCrow data to AI assistants
// Supports: Claude Code, Cursor, Windsurf, and any MCP-compatible client
// Authentication: API key via Authorization: Bearer header

import { Hono } from "hono";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { monitors, incidents, statusPages, heartbeats, checkResults, organizations, apiKeys } from "../db/schema.js";
import { hashApiKey, looksLikeApiKey } from "../utils/api-key.js";
import { logger } from "../utils/logger.js";

export const mcpRoutes = new Hono();

// ── API key auth for MCP ──
async function authenticateMcp(authHeader: string | undefined): Promise<{ orgId: string } | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const raw = authHeader.slice(7).trim();
  if (!looksLikeApiKey(raw)) return null;
  const hash = await hashApiKey(raw);
  const [key] = await db
    .select({ orgId: apiKeys.orgId, revokedAt: apiKeys.revokedAt })
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, hash))
    .limit(1);
  if (!key || key.revokedAt) return null;
  // Touch lastUsedAt without blocking
  db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.keyHash, hash)).catch(() => {});
  return { orgId: key.orgId };
}

// ── Tool definitions ──
const TOOLS = [
  {
    name: "get_status_summary",
    description: "Get the overall uptime status for your organization: how many monitors are up/down, active incidents, and average uptime over the last 24 hours.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "list_monitors",
    description: "List all monitors with their current status, uptime percentage, and last response time.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["up", "down", "degraded", "unknown", "all"],
          description: "Filter by monitor status. Default: all",
        },
      },
      required: [],
    },
  },
  {
    name: "list_active_incidents",
    description: "List all open (unresolved) incidents with their status, severity, and latest update.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_monitor_detail",
    description: "Get detailed information for a specific monitor including recent check results and response time history.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The monitor name (partial match supported)",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "list_heartbeats",
    description: "List all heartbeat monitors and their health status (healthy/late/paused).",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

// ── Tool handlers ──
async function handleGetStatusSummary(orgId: string) {
  const allMonitors = await db
    .select({ status: monitors.status, name: monitors.name })
    .from(monitors)
    .where(and(eq(monitors.orgId, orgId), eq(monitors.isActive, true)));

  const activeIncidentRows = await db
    .select({ id: incidents.id, title: incidents.title, severity: incidents.severity })
    .from(incidents)
    .where(and(eq(incidents.orgId, orgId), sql`${incidents.status} != 'resolved'`));

  const counts = { up: 0, down: 0, degraded: 0, unknown: 0 };
  for (const m of allMonitors) counts[m.status as keyof typeof counts]++;

  const overallStatus = counts.down > 0 ? "major_outage"
    : counts.degraded > 0 ? "degraded"
    : "operational";

  return {
    overallStatus,
    monitors: {
      total: allMonitors.length,
      up: counts.up,
      down: counts.down,
      degraded: counts.degraded,
      unknown: counts.unknown,
    },
    activeIncidents: activeIncidentRows.length,
    incidents: activeIncidentRows.map((i) => ({ id: i.id, title: i.title, severity: i.severity })),
    checkedAt: new Date().toISOString(),
  };
}

async function handleListMonitors(orgId: string, status?: string) {
  const rows = await db
    .select({
      id: monitors.id,
      name: monitors.name,
      url: monitors.url,
      type: monitors.type,
      status: monitors.status,
      lastCheckedAt: monitors.lastCheckedAt,
      lastResponseMs: monitors.lastResponseMs,
      intervalSeconds: monitors.intervalSeconds,
    })
    .from(monitors)
    .where(
      and(
        eq(monitors.orgId, orgId),
        eq(monitors.isActive, true),
        status && status !== "all" ? eq(monitors.status, status as "up" | "down" | "degraded" | "unknown") : undefined,
      ),
    )
    .orderBy(monitors.name);

  // Get 30-day uptime for each monitor
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const withUptime = await Promise.all(
    rows.map(async (m) => {
      const [stats] = await db
        .select({
          total: sql<number>`count(*)`,
          up: sql<number>`count(*) filter (where ${checkResults.status} = 'up')`,
        })
        .from(checkResults)
        .where(and(eq(checkResults.monitorId, m.id), sql`${checkResults.checkedAt} > ${thirtyDaysAgo.toISOString()}`));
      const total = Number(stats?.total || 0);
      const up = Number(stats?.up || 0);
      return {
        ...m,
        lastCheckedAt: m.lastCheckedAt?.toISOString() ?? null,
        uptimePercent30d: total > 0 ? parseFloat(((up / total) * 100).toFixed(2)) : null,
      };
    }),
  );

  return { monitors: withUptime, total: withUptime.length };
}

async function handleListActiveIncidents(orgId: string) {
  const rows = await db
    .select()
    .from(incidents)
    .where(and(eq(incidents.orgId, orgId), sql`${incidents.status} != 'resolved'`))
    .orderBy(desc(incidents.startedAt));

  return {
    incidents: rows.map((i) => ({
      id: i.id,
      title: i.title,
      status: i.status,
      severity: i.severity,
      startedAt: i.startedAt.toISOString(),
      durationMinutes: Math.round((Date.now() - i.startedAt.getTime()) / 60_000),
    })),
    total: rows.length,
  };
}

async function handleGetMonitorDetail(orgId: string, name: string) {
  const allMonitors = await db
    .select()
    .from(monitors)
    .where(and(eq(monitors.orgId, orgId), eq(monitors.isActive, true)));

  const match = allMonitors.find((m) =>
    m.name.toLowerCase().includes(name.toLowerCase()),
  );
  if (!match) return { error: `No monitor found matching "${name}"` };

  const recent = await db
    .select({ status: checkResults.status, responseMs: checkResults.responseMs, checkedAt: checkResults.checkedAt })
    .from(checkResults)
    .where(eq(checkResults.monitorId, match.id))
    .orderBy(desc(checkResults.checkedAt))
    .limit(20);

  return {
    monitor: {
      id: match.id,
      name: match.name,
      url: match.url,
      type: match.type,
      status: match.status,
      intervalSeconds: match.intervalSeconds,
      lastCheckedAt: match.lastCheckedAt?.toISOString() ?? null,
      lastResponseMs: match.lastResponseMs,
      sslExpiresAt: match.sslExpiresAt?.toISOString() ?? null,
    },
    recentChecks: recent.map((r) => ({
      status: r.status,
      responseMs: r.responseMs,
      checkedAt: r.checkedAt.toISOString(),
    })),
  };
}

async function handleListHeartbeats(orgId: string) {
  const rows = await db
    .select()
    .from(heartbeats)
    .where(and(eq(heartbeats.orgId, orgId), eq(heartbeats.isActive, true)))
    .orderBy(heartbeats.name);

  return {
    heartbeats: rows.map((h) => ({
      id: h.id,
      name: h.name,
      status: h.status,
      lastPingAt: h.lastPingAt?.toISOString() ?? null,
      periodSeconds: h.period,
      graceSeconds: h.grace,
      pingUrl: `${process.env.APP_URL || "https://app.uptimecrow.com"}/hb/${h.slug}`,
    })),
    total: rows.length,
  };
}

// ── MCP endpoint — HTTP transport ──
// POST /api/mcp  with JSON-RPC 2.0 body

mcpRoutes.post("/", async (c) => {
  const auth = await authenticateMcp(c.req.header("Authorization"));
  if (!auth) {
    return c.json({
      jsonrpc: "2.0",
      error: { code: -32001, message: "Unauthorized — provide an API key via Authorization: Bearer <key>" },
      id: null,
    }, 401);
  }

  let body: { jsonrpc: string; method: string; params?: Record<string, unknown>; id?: string | number };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null }, 400);
  }

  const { method, params = {}, id } = body;
  logger.info(`[MCP] ${method} from org ${auth.orgId}`);

  try {
    if (method === "initialize") {
      return c.json({
        jsonrpc: "2.0",
        result: {
          protocolVersion: "2024-11-05",
          serverInfo: { name: "uptimecrow", version: "1.0.0" },
          capabilities: { tools: {} },
        },
        id,
      });
    }

    if (method === "tools/list") {
      return c.json({ jsonrpc: "2.0", result: { tools: TOOLS }, id });
    }

    if (method === "tools/call") {
      const toolName = params.name as string;
      const toolArgs = (params.arguments ?? {}) as Record<string, string>;

      let result: unknown;
      if (toolName === "get_status_summary") {
        result = await handleGetStatusSummary(auth.orgId);
      } else if (toolName === "list_monitors") {
        result = await handleListMonitors(auth.orgId, toolArgs.status);
      } else if (toolName === "list_active_incidents") {
        result = await handleListActiveIncidents(auth.orgId);
      } else if (toolName === "get_monitor_detail") {
        result = await handleGetMonitorDetail(auth.orgId, toolArgs.name);
      } else if (toolName === "list_heartbeats") {
        result = await handleListHeartbeats(auth.orgId);
      } else {
        return c.json({
          jsonrpc: "2.0",
          error: { code: -32601, message: `Unknown tool: ${toolName}` },
          id,
        }, 400);
      }

      return c.json({
        jsonrpc: "2.0",
        result: {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        },
        id,
      });
    }

    return c.json({
      jsonrpc: "2.0",
      error: { code: -32601, message: `Method not found: ${method}` },
      id,
    }, 404);
  } catch (err) {
    logger.error({ err }, "[MCP] Internal error");
    return c.json({
      jsonrpc: "2.0",
      error: { code: -32603, message: "Internal error" },
      id,
    }, 500);
  }
});

// GET /api/mcp — returns MCP server info for discovery
mcpRoutes.get("/", (c) => {
  const baseUrl = process.env.APP_URL || "https://app.uptimecrow.com";
  return c.json({
    name: "UptimeCrow MCP Server",
    version: "1.0.0",
    protocolVersion: "2024-11-05",
    description: "Monitor your services, query incidents, and check uptime from any MCP-compatible AI assistant.",
    endpoint: `${baseUrl}/api/mcp`,
    authentication: "API key via Authorization: Bearer header. Generate one in Settings → API Keys.",
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
    quickstart: {
      claudeCode: `# Add to your Claude Code MCP config:\n{\n  "mcpServers": {\n    "uptimecrow": {\n      "command": "npx",\n      "args": ["-y", "@modelcontextprotocol/server-fetch"],\n      "env": {\n        "MCP_FETCH_URL": "${baseUrl}/api/mcp",\n        "MCP_FETCH_BEARER": "uc_your_api_key"\n      }\n    }\n  }\n}`,
      cursor: `# Add to .cursor/mcp.json:\n{\n  "mcpServers": {\n    "uptimecrow": {\n      "url": "${baseUrl}/api/mcp",\n      "headers": { "Authorization": "Bearer uc_your_api_key" }\n    }\n  }\n}`,
    },
  });
});
