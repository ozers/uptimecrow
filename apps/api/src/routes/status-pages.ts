import { Hono } from "hono";
import { eq, and, sql, count, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { statusPages, statusPageMonitors, monitors, organizations } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { createStatusPageSchema, updateStatusPageSchema, PLAN_LIMITS } from "@uptimecrow/shared";

export const statusPageRoutes = new Hono();

statusPageRoutes.use("*", authMiddleware);

// List status pages
statusPageRoutes.get("/", async (c) => {
  const { orgId } = c.get("user");

  const result = await db
    .select()
    .from(statusPages)
    .where(eq(statusPages.orgId, orgId));

  return c.json({ statusPages: result });
});

// Get single status page
statusPageRoutes.get("/:id", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");

  const [page] = await db
    .select()
    .from(statusPages)
    .where(and(eq(statusPages.id, id), eq(statusPages.orgId, orgId)))
    .limit(1);

  if (!page) {
    return c.json({ error: "Status page not found" }, 404);
  }

  const linkedMonitors = await db
    .select({ monitorId: statusPageMonitors.monitorId, groupName: statusPageMonitors.groupName })
    .from(statusPageMonitors)
    .where(eq(statusPageMonitors.statusPageId, id));

  return c.json({ statusPage: page, monitors: linkedMonitors });
});

// Create status page
statusPageRoutes.post("/", async (c) => {
  const { orgId } = c.get("user");
  const body = await c.req.json();
  const parsed = createStatusPageSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  // Enforce plan limits
  const [org] = await db
    .select({ plan: organizations.plan })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  const limits = PLAN_LIMITS[org?.plan ?? "free"];

  const [{ total }] = await db
    .select({ total: count() })
    .from(statusPages)
    .where(eq(statusPages.orgId, orgId));

  if (Number(total) >= limits.statusPages) {
    return c.json(
      { error: `Status page limit reached. Your plan allows ${limits.statusPages} status page(s).` },
      403,
    );
  }

  // Check slug uniqueness
  const existing = await db
    .select({ id: statusPages.id })
    .from(statusPages)
    .where(eq(statusPages.slug, parsed.data.slug))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ error: "Slug already taken" }, 409);
  }

  const [page] = await db
    .insert(statusPages)
    .values({ ...parsed.data, orgId })
    .returning();

  return c.json({ statusPage: page }, 201);
});

// Update status page
statusPageRoutes.patch("/:id", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateStatusPageSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  // If slug is being updated, check uniqueness
  if (parsed.data.slug) {
    const existing = await db
      .select({ id: statusPages.id })
      .from(statusPages)
      .where(eq(statusPages.slug, parsed.data.slug))
      .limit(1);

    if (existing.length > 0 && existing[0].id !== id) {
      return c.json({ error: "Slug already taken" }, 409);
    }
  }

  const [page] = await db
    .update(statusPages)
    .set(parsed.data)
    .where(and(eq(statusPages.id, id), eq(statusPages.orgId, orgId)))
    .returning();

  if (!page) {
    return c.json({ error: "Status page not found" }, 404);
  }

  return c.json({ statusPage: page });
});

// Delete status page
statusPageRoutes.delete("/:id", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");

  const [deleted] = await db
    .delete(statusPages)
    .where(and(eq(statusPages.id, id), eq(statusPages.orgId, orgId)))
    .returning({ id: statusPages.id });

  if (!deleted) {
    return c.json({ error: "Status page not found" }, 404);
  }

  return c.json({ ok: true });
});

// Regenerate access token for private status page
statusPageRoutes.post("/:id/regenerate-token", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");

  const [page] = await db
    .update(statusPages)
    .set({ accessToken: sql`gen_random_uuid()` })
    .where(and(eq(statusPages.id, id), eq(statusPages.orgId, orgId)))
    .returning({ accessToken: statusPages.accessToken });

  if (!page) {
    return c.json({ error: "Status page not found" }, 404);
  }

  return c.json({ accessToken: page.accessToken });
});

// Set custom domain
statusPageRoutes.put("/:id/domain", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");
  const { domain } = await c.req.json<{ domain: string | null }>();

  const [page] = await db
    .select({ id: statusPages.id })
    .from(statusPages)
    .where(and(eq(statusPages.id, id), eq(statusPages.orgId, orgId)))
    .limit(1);

  if (!page) return c.json({ error: "Status page not found" }, 404);

  // If setting a domain, verify it's allowed on this plan, then verify CNAME.
  if (domain) {
    const [org] = await db
      .select({ plan: organizations.plan })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);
    if (!PLAN_LIMITS[org?.plan ?? "free"].customDomain) {
      return c.json(
        { error: "Custom domains are available on the Indie plan and above." },
        403,
      );
    }
    try {
      const dns = await import("dns");
      const { promisify } = await import("util");
      const resolveCname = promisify(dns.resolveCname);
      const records = await resolveCname(domain);
      const expectedTarget = process.env.STATUS_CNAME_TARGET || "status.uptimecrow.com";
      const valid = records.some((r) => r === expectedTarget || r.endsWith(".uptimecrow.com"));
      if (!valid) {
        return c.json({
          error: `CNAME not configured. Point ${domain} to ${expectedTarget}`,
          records,
        }, 400);
      }
    } catch {
      return c.json({
        error: `Could not verify DNS for ${domain}. Make sure CNAME points to ${process.env.STATUS_CNAME_TARGET || "status.uptimecrow.com"}`,
      }, 400);
    }
  }

  await db
    .update(statusPages)
    .set({ customDomain: domain })
    .where(eq(statusPages.id, id));

  return c.json({ ok: true, customDomain: domain });
});

// Set monitors for a status page
statusPageRoutes.put("/:id/monitors", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json<{ monitors: { monitorId: string; groupName?: string | null }[] }>();

  // Verify status page belongs to org
  const [page] = await db
    .select({ id: statusPages.id })
    .from(statusPages)
    .where(and(eq(statusPages.id, id), eq(statusPages.orgId, orgId)))
    .limit(1);

  if (!page) {
    return c.json({ error: "Status page not found" }, 404);
  }

  const monitorEntries = body.monitors ?? [];

  // Verify every monitor belongs to this org before linking. Without this a
  // user could attach another org's monitor to their own public status page,
  // leaking that monitor's name/status/uptime cross-tenant (IDOR).
  if (monitorEntries.length > 0) {
    const requestedIds = [...new Set(monitorEntries.map((m) => m.monitorId))];
    const owned = await db
      .select({ id: monitors.id })
      .from(monitors)
      .where(and(eq(monitors.orgId, orgId), inArray(monitors.id, requestedIds)));
    const ownedIds = new Set(owned.map((m) => m.id));
    const foreign = requestedIds.filter((mid) => !ownedIds.has(mid));
    if (foreign.length > 0) {
      return c.json(
        { error: "One or more monitors do not belong to your organization." },
        403,
      );
    }
  }

  // Replace all monitor links
  await db.delete(statusPageMonitors).where(eq(statusPageMonitors.statusPageId, id));

  if (monitorEntries.length > 0) {
    await db.insert(statusPageMonitors).values(
      monitorEntries.map(({ monitorId, groupName }) => ({
        statusPageId: id,
        monitorId,
        groupName: groupName || null,
      })),
    );
  }

  return c.json({ ok: true, monitors: monitorEntries });
});
