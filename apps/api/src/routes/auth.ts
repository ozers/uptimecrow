import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { redis } from "../db/index.js";
import { users, organizations, orgMembers } from "../db/schema.js";
import { createToken } from "../utils/auth.js";
import { registerSchema, loginSchema } from "@uptimecrow/shared";
import { authMiddleware } from "../middleware/auth.js";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { logger } from "../utils/logger.js";
import { track } from "../utils/beacon.js";

export const authRoutes = new Hono();

// Exported for tests: the org slug derived from the local part of an email.
export function orgSlugFromEmail(email: string): string {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 50);
}

authRoutes.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const { email, password, name } = parsed.data;

  // Check if email already exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const [user] = await db
    .insert(users)
    .values({ email, name, passwordHash })
    .returning({ id: users.id, email: users.email, name: users.name });

  // Every new account gets its own organization. Lowercase first: the character
  // class has no A-Z, so "Ozer@..." used to slugify to "----" — every uppercase
  // letter became a dash.
  const slug = orgSlugFromEmail(email);
  const [org] = await db.insert(organizations).values({ name: `${name}'s Org`, slug: `${slug}-${user.id.slice(0, 6)}`, ownerId: user.id }).returning({ id: organizations.id });
  const orgId = org.id;

  track("signup", { method: "email" }, user.id);

  const token = await createToken({ sub: user.id, email: user.email, orgId });

  setCookie(c, "token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return c.json({ user: { id: user.id, email: user.email, name: user.name }, token }, 201);
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  if (!user.passwordHash) {
    // Legacy accounts created without a password (e.g. via a since-removed
    // OAuth flow) get the same generic error to prevent account enumeration.
    // They can regain access through the password-reset flow.
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  // Prefer membership org over personal org (team member flow)
  const [membership] = await db
    .select({ orgId: orgMembers.orgId })
    .from(orgMembers)
    .where(eq(orgMembers.userId, user.id))
    .limit(1);

  let orgId: string;
  if (membership) {
    orgId = membership.orgId;
  } else {
    const [org] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.ownerId, user.id))
      .limit(1);
    if (!org) return c.json({ error: "No organization found" }, 500);
    orgId = org.id;
  }

  const token = await createToken({ sub: user.id, email: user.email, orgId });

  setCookie(c, "token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return c.json({
    user: { id: user.id, email: user.email, name: user.name },
    token,
  });
});

authRoutes.post("/logout", (c) => {
  deleteCookie(c, "token", { path: "/" });
  return c.json({ ok: true });
});

// Request password reset
authRoutes.post("/forgot-password", async (c) => {
  const { email } = await c.req.json<{ email: string }>();
  if (!email) return c.json({ error: "Email required" }, 400);

  // Always return success to prevent email enumeration
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await redis.set(`pw-reset:${token}`, user.id, "EX", 3600); // 1 hour TTL

    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    if (accessKeyId && secretAccessKey) {
      const ses = new SESv2Client({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: { accessKeyId, secretAccessKey },
      });
      await ses.send(new SendEmailCommand({
        FromEmailAddress: process.env.SES_FROM_EMAIL || "UptimeCrow <noreply@uptimecrow.com>",
        Destination: { ToAddresses: [email] },
        Content: {
          Simple: {
            Subject: { Data: "Reset your password", Charset: "UTF-8" },
            Body: { Html: { Data: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, ignore this email.</p>`, Charset: "UTF-8" } },
          },
        },
      })).catch((err: unknown) => logger.error({ err }, "[Auth] Failed to send reset email"));
    } else {
      logger.info(`[Auth] Password reset link (no AWS credentials): ${resetUrl}`);
    }
  }

  return c.json({ message: "If that email exists, we sent a reset link." });
});

// Reset password with token
authRoutes.post("/reset-password", async (c) => {
  const { token, password } = await c.req.json<{ token: string; password: string }>();
  if (!token || !password || password.length < 8) {
    return c.json({ error: "Valid token and password (min 8 chars) required" }, 400);
  }

  const userId = await redis.get(`pw-reset:${token}`);
  if (!userId) {
    return c.json({ error: "Invalid or expired reset link" }, 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  await redis.del(`pw-reset:${token}`);

  return c.json({ message: "Password updated. You can now log in." });
});

authRoutes.get("/me", authMiddleware, async (c) => {
  const { sub } = c.get("user");

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, sub))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ user });
});
