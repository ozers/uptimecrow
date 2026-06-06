import { Hono } from "hono";
import { eq, and, desc, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { apiKeys, organizations } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { generateApiKey } from "../utils/api-key.js";
import { PLAN_LIMITS } from "@uptimecrow/shared";
import { logger } from "../utils/logger.js";

export const apiKeyRoutes = new Hono();
apiKeyRoutes.use("*", authMiddleware);

// Creating keys from an API key itself would be an escalation surface; only
// allow the dashboard (JWT) to manage keys.
apiKeyRoutes.use("*", async (c, next) => {
  const method = c.get("authMethod");
  if (method !== "jwt" && c.req.method !== "GET") {
    return c.json({ error: "API key management requires dashboard sign-in" }, 403);
  }
  return next();
});

async function ensureApiAccess(orgId: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const [org] = await db
    .select({ plan: organizations.plan })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!org) return { ok: false, reason: "Organization not found" };
  if (!PLAN_LIMITS[org.plan].apiAccess) {
    return { ok: false, reason: "API access requires the Indie plan or higher" };
  }
  return { ok: true };
}

apiKeyRoutes.get("/", async (c) => {
  const { orgId } = c.get("user");
  const rows = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.orgId, orgId), isNull(apiKeys.revokedAt)))
    .orderBy(desc(apiKeys.createdAt));
  return c.json({ apiKeys: rows });
});

const createSchema = z.object({
  name: z.string().min(1).max(255),
});

apiKeyRoutes.post("/", async (c) => {
  const { sub, orgId } = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", issues: parsed.error.issues }, 400);
  }

  const plan = await ensureApiAccess(orgId);
  if (!plan.ok) return c.json({ error: plan.reason }, 403);

  const { key, hash, prefix } = generateApiKey();
  const [inserted] = await db
    .insert(apiKeys)
    .values({
      orgId,
      userId: sub,
      name: parsed.data.name.trim(),
      keyHash: hash,
      prefix,
    })
    .returning({
      id: apiKeys.id,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      createdAt: apiKeys.createdAt,
    });

  logger.info({ keyId: inserted.id, orgId }, "[API] API key created");

  return c.json({
    apiKey: inserted,
    // Returned once at creation; UI instructs the user to copy it.
    key,
  }, 201);
});

apiKeyRoutes.delete("/:id", async (c) => {
  const { orgId } = c.get("user");
  const id = c.req.param("id");

  const [existing] = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.orgId, orgId), isNull(apiKeys.revokedAt)))
    .limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);

  await db.update(apiKeys).set({ revokedAt: new Date() }).where(eq(apiKeys.id, id));
  logger.info({ keyId: id, orgId }, "[API] API key revoked");

  return c.json({ ok: true });
});
