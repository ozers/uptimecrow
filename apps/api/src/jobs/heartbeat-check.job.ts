import type { Job } from "bullmq";
import { and, eq, inArray, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { heartbeats, organizations } from "../db/schema.js";
import { sendHeartbeatLateAlert } from "../services/notification.service.js";
import { logger } from "../utils/logger.js";

export async function processHeartbeatCheckJob(_job: Job): Promise<void> {
  const now = new Date();

  // Heartbeats that pinged at least once but are now overdue and not already late/paused.
  const overdue = await db
    .select({
      id: heartbeats.id,
      name: heartbeats.name,
      orgId: heartbeats.orgId,
    })
    .from(heartbeats)
    .where(
      and(
        eq(heartbeats.isActive, true),
        ne(heartbeats.status, "late"),
        ne(heartbeats.status, "paused"),
        isNotNull(heartbeats.lastPingAt),
        lt(
          sql`${heartbeats.lastPingAt} + (${heartbeats.period} + ${heartbeats.grace}) * interval '1 second'`,
          now,
        ),
      ),
    );

  // Heartbeats that truly never pinged (no lastPingAt) but were created long enough ago.
  // Excludes re-enabled heartbeats that have a previous ping — those are caught by `overdue`.
  const neverPinged = await db
    .select({
      id: heartbeats.id,
      name: heartbeats.name,
      orgId: heartbeats.orgId,
    })
    .from(heartbeats)
    .where(
      and(
        eq(heartbeats.isActive, true),
        eq(heartbeats.status, "unknown"),
        isNull(heartbeats.lastPingAt),
        lt(
          sql`${heartbeats.createdAt} + (${heartbeats.period} + ${heartbeats.grace}) * interval '1 second'`,
          now,
        ),
      ),
    );

  const toLate = [...overdue, ...neverPinged];
  if (toLate.length === 0) return;

  const ids = toLate.map((h) => h.id);
  await db
    .update(heartbeats)
    .set({ status: "late" })
    .where(inArray(heartbeats.id, ids));

  // Group by org to batch webhook fetches
  const orgIds = [...new Set(toLate.map((h) => h.orgId))];
  const orgs = await db
    .select({
      id: organizations.id,
      slackWebhookUrl: organizations.slackWebhookUrl,
      discordWebhookUrl: organizations.discordWebhookUrl,
    })
    .from(organizations)
    .where(inArray(organizations.id, orgIds));

  const orgMap = new Map(orgs.map((o) => [o.id, o]));

  for (const h of toLate) {
    logger.warn({ heartbeatId: h.id, orgId: h.orgId }, `[Heartbeat] "${h.name}" is late`);
    const org = orgMap.get(h.orgId);
    if (org?.slackWebhookUrl || org?.discordWebhookUrl) {
      await sendHeartbeatLateAlert({
        heartbeatName: h.name,
        slackWebhookUrl: org.slackWebhookUrl,
        discordWebhookUrl: org.discordWebhookUrl,
      });
    }
  }
}
