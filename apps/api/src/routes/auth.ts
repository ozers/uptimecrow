import { Hono } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { redis } from "../db/index.js";
import { users, organizations, orgMembers, orgInvites } from "../db/schema.js";
import { createToken } from "../utils/auth.js";
import { registerSchema, loginSchema } from "@uptimecrow/shared";
import { authMiddleware } from "../middleware/auth.js";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { logger } from "../utils/logger.js";

export const authRoutes = new Hono();

authRoutes.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const { email, password, name } = parsed.data;

  // Check if email already exists
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const [user] = await db
    .insert(users)
    .values({ email, name, passwordHash })
    .returning({ id: users.id, email: users.email, name: users.name });

  // Handle invite token — join existing org instead of creating a new one
  const inviteToken = (body as Record<string, unknown>).inviteToken as string | undefined;
  let orgId: string;

  if (inviteToken) {
    const [invite] = await db
      .select({ id: orgInvites.id, orgId: orgInvites.orgId, expiresAt: orgInvites.expiresAt, acceptedAt: orgInvites.acceptedAt, role: orgInvites.role })
      .from(orgInvites)
      .where(eq(orgInvites.token, inviteToken as `${string}-${string}-${string}-${string}-${string}`))
      .limit(1);

    if (invite && !invite.acceptedAt && new Date(invite.expiresAt) > new Date()) {
      await db.insert(orgMembers).values({ orgId: invite.orgId, userId: user.id, role: invite.role }).onConflictDoNothing();
      await db.update(orgInvites).set({ acceptedAt: new Date() }).where(eq(orgInvites.id, invite.id));
      orgId = invite.orgId;
    } else {
      // Invite invalid — fall through to create own org
      const slug = email.split("@")[0].replace(/[^a-z0-9-]/g, "-").slice(0, 50);
      const [org] = await db.insert(organizations).values({ name: `${name}'s Org`, slug: `${slug}-${user.id.slice(0, 6)}`, ownerId: user.id }).returning({ id: organizations.id });
      orgId = org.id;
    }
  } else {
    const slug = email.split("@")[0].replace(/[^a-z0-9-]/g, "-").slice(0, 50);
    const [org] = await db.insert(organizations).values({ name: `${name}'s Org`, slug: `${slug}-${user.id.slice(0, 6)}`, ownerId: user.id }).returning({ id: organizations.id });
    orgId = org.id;
  }

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

// Accept invite while already logged in
authRoutes.post("/accept-invite", authMiddleware, async (c) => {
  const { sub } = c.get("user");
  const { token: inviteToken } = await c.req.json<{ token: string }>();

  const [invite] = await db
    .select({ id: orgInvites.id, orgId: orgInvites.orgId, expiresAt: orgInvites.expiresAt, acceptedAt: orgInvites.acceptedAt, role: orgInvites.role })
    .from(orgInvites)
    .where(eq(orgInvites.token, inviteToken as `${string}-${string}-${string}-${string}-${string}`))
    .limit(1);

  if (!invite) return c.json({ error: "Invite not found" }, 404);
  if (invite.acceptedAt) return c.json({ error: "Invite already accepted" }, 410);
  if (new Date(invite.expiresAt) < new Date()) return c.json({ error: "Invite expired" }, 410);

  await db.insert(orgMembers).values({ orgId: invite.orgId, userId: sub, role: invite.role }).onConflictDoNothing();
  await db.update(orgInvites).set({ acceptedAt: new Date() }).where(eq(orgInvites.id, invite.id));

  const [user] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, sub)).limit(1);
  if (!user) return c.json({ error: "User not found" }, 404);

  const newToken = await createToken({ sub, email: user.email, orgId: invite.orgId });

  setCookie(c, "token", newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return c.json({ ok: true, token: newToken });
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
    return c.json({ error: "This account uses Google sign-in. Please log in with Google." }, 401);
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

// Google OAuth — redirect to Google
authRoutes.get("/google", async (c) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return c.json({ error: "Google OAuth not configured" }, 503);

  const state = crypto.randomBytes(16).toString("hex");
  await redis.set(`oauth-state:${state}`, "1", "EX", 600);

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// Google OAuth — callback
authRoutes.get("/google/callback", async (c) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return c.text("Google OAuth not configured", 503);

  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");

  const appUrl = process.env.APP_URL || "http://localhost:5173";

  if (error || !code || !state) {
    return c.redirect(`${appUrl}/login?error=google_cancelled`);
  }

  const stateValid = await redis.get(`oauth-state:${state}`);
  if (!stateValid) return c.redirect(`${appUrl}/login?error=google_state`);
  await redis.del(`oauth-state:${state}`);

  // Exchange code for token
  const redirectUri = `${process.env.APP_URL || "http://localhost:3000"}/api/auth/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) return c.redirect(`${appUrl}/login?error=google_token`);
  const tokenData = await tokenRes.json() as { access_token: string };

  // Get user info
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!userInfoRes.ok) return c.redirect(`${appUrl}/login?error=google_userinfo`);
  const googleUser = await userInfoRes.json() as { sub: string; email: string; name: string };

  // Upsert user by google_id or email
  let user = (await db.select({ id: users.id, email: users.email, name: users.name }).from(users).where(eq(users.googleId, googleUser.sub)).limit(1))[0]
    ?? (await db.select({ id: users.id, email: users.email, name: users.name }).from(users).where(eq(users.email, googleUser.email)).limit(1))[0];

  if (!user) {
    // New user — create account + org
    const [newUser] = await db
      .insert(users)
      .values({ email: googleUser.email, name: googleUser.name, googleId: googleUser.sub })
      .returning({ id: users.id, email: users.email, name: users.name });
    user = newUser;

    const slug = googleUser.email.split("@")[0].replace(/[^a-z0-9-]/g, "-").slice(0, 50);
    await db.insert(organizations).values({ name: `${googleUser.name}'s Org`, slug: `${slug}-${user.id.slice(0, 6)}`, ownerId: user.id });
  } else if (!user) {
    return c.redirect(`${appUrl}/login?error=google_create`);
  } else {
    // Link google_id if not set
    await db.update(users).set({ googleId: googleUser.sub }).where(and(eq(users.id, user.id)));
  }

  // Get org
  const [membership] = await db.select({ orgId: orgMembers.orgId }).from(orgMembers).where(eq(orgMembers.userId, user.id)).limit(1);
  let orgId: string;
  if (membership) {
    orgId = membership.orgId;
  } else {
    const [org] = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.ownerId, user.id)).limit(1);
    if (!org) return c.redirect(`${appUrl}/login?error=no_org`);
    orgId = org.id;
  }

  const jwtToken = await createToken({ sub: user.id, email: user.email, orgId });

  setCookie(c, "token", jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return c.redirect(`${appUrl}/dashboard`);
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
