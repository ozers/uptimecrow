import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { eq, isNull, and } from "drizzle-orm";
import { verifyToken, type JwtPayload } from "../utils/auth.js";
import { db } from "../db/index.js";
import { apiKeys, users } from "../db/schema.js";
import { hashApiKey, looksLikeApiKey } from "../utils/api-key.js";

declare module "hono" {
  interface ContextVariableMap {
    user: JwtPayload;
    authMethod: "jwt" | "api_key";
  }
}

async function authenticateApiKey(token: string): Promise<JwtPayload | null> {
  const hash = hashApiKey(token);
  const [row] = await db
    .select({
      id: apiKeys.id,
      orgId: apiKeys.orgId,
      userId: apiKeys.userId,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, hash), isNull(apiKeys.revokedAt)))
    .limit(1);

  if (!row) return null;

  // Update lastUsedAt opportunistically — fire-and-forget so we don't slow the
  // authenticated request. Drops on DB error because it's non-critical.
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.id))
    .catch(() => {});

  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, row.userId))
    .limit(1);
  if (!user) return null;

  return { sub: user.id, email: user.email, orgId: row.orgId };
}

export async function authMiddleware(c: Context, next: Next) {
  const token =
    getCookie(c, "token") ||
    c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (looksLikeApiKey(token)) {
    const payload = await authenticateApiKey(token);
    if (!payload) return c.json({ error: "Invalid or revoked API key" }, 401);
    c.set("user", payload);
    c.set("authMethod", "api_key");
    return next();
  }

  try {
    const payload = await verifyToken(token);
    c.set("user", payload);
    c.set("authMethod", "jwt");
    return next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}
