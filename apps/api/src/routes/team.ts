import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { organizations, orgMembers, orgInvites, users } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";
import { PLAN_LIMITS } from "@uptimecrow/shared";
import type { Plan } from "@uptimecrow/shared";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

export const teamRoutes = new Hono();

teamRoutes.use("*", authMiddleware);

// List members + pending invites
teamRoutes.get("/", async (c) => {
  const { orgId } = c.get("user");

  const [org] = await db
    .select({ plan: organizations.plan })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const members = await db
    .select({
      id: orgMembers.id,
      userId: orgMembers.userId,
      role: orgMembers.role,
      createdAt: orgMembers.createdAt,
      name: users.name,
      email: users.email,
    })
    .from(orgMembers)
    .innerJoin(users, eq(users.id, orgMembers.userId))
    .where(eq(orgMembers.orgId, orgId));

  const invites = await db
    .select({
      id: orgInvites.id,
      email: orgInvites.email,
      role: orgInvites.role,
      expiresAt: orgInvites.expiresAt,
      acceptedAt: orgInvites.acceptedAt,
      createdAt: orgInvites.createdAt,
    })
    .from(orgInvites)
    .where(and(eq(orgInvites.orgId, orgId)));

  return c.json({ members, invites, plan: org?.plan ?? "free" });
});

// Invite a new member
teamRoutes.post("/invite", async (c) => {
  const { orgId, sub } = c.get("user");
  const { email, role = "member" } = await c.req.json<{ email: string; role?: string }>();

  if (!email) return c.json({ error: "Email required" }, 400);
  if (!["admin", "member"].includes(role)) return c.json({ error: "Invalid role" }, 400);

  const [org] = await db
    .select({ plan: organizations.plan, name: organizations.name, ownerId: organizations.ownerId })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) return c.json({ error: "Organization not found" }, 404);
  if (org.ownerId !== sub) return c.json({ error: "Only the org owner can invite members" }, 403);

  // Check plan seat limit
  const memberCount = await db
    .select({ id: orgMembers.id })
    .from(orgMembers)
    .where(eq(orgMembers.orgId, orgId));

  const limit = PLAN_LIMITS[org.plan as Plan].teamSeats;
  if (memberCount.length >= limit) {
    return c.json({ error: `Your plan allows up to ${limit} team seats. Upgrade to add more.` }, 403);
  }

  // Check for duplicate invite or existing member
  const existing = await db
    .select({ id: orgInvites.id })
    .from(orgInvites)
    .where(and(eq(orgInvites.orgId, orgId), eq(orgInvites.email, email)))
    .limit(1);

  if (existing.length > 0) return c.json({ error: "Invite already sent to this email" }, 409);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const [invite] = await db
    .insert(orgInvites)
    .values({ orgId, email, role, expiresAt })
    .returning();

  // Send invite email
  const appUrl = process.env.APP_URL || "http://localhost:5173";
  const inviteUrl = `${appUrl}/invite/${invite.token}`;

  const [inviter] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, sub))
    .limit(1);

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
          Subject: { Data: `${inviter?.name ?? "Someone"} invited you to join ${org.name} on UptimeCrow`, Charset: "UTF-8" },
          Body: {
            Html: {
              Data: `
                <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto">
                  <h2 style="color:#1a1a1a">You've been invited to ${org.name}</h2>
                  <p style="color:#4a4a4a;line-height:1.6;margin-top:16px">
                    ${inviter?.name ?? "A team member"} has invited you to join <strong>${org.name}</strong> on UptimeCrow as a <strong>${role}</strong>.
                  </p>
                  <p style="margin:24px 0">
                    <a href="${inviteUrl}" style="background:#00e676;color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">
                      Accept Invitation
                    </a>
                  </p>
                  <p style="color:#9a9a9a;font-size:12px">This invite expires in 7 days. If you didn't expect this, you can safely ignore it.</p>
                </div>
              `,
              Charset: "UTF-8",
            },
          },
        },
      },
    })).catch((err: unknown) => logger.error({ err }, "[Team] Failed to send invite email"));
  } else {
    logger.info(`[Team] Invite link (no AWS): ${inviteUrl}`);
  }

  return c.json({ invite }, 201);
});

// Remove a member
teamRoutes.delete("/members/:userId", async (c) => {
  const { orgId, sub } = c.get("user");
  const targetUserId = c.req.param("userId");

  const [org] = await db
    .select({ ownerId: organizations.ownerId })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) return c.json({ error: "Organization not found" }, 404);
  if (org.ownerId !== sub) return c.json({ error: "Only the org owner can remove members" }, 403);
  if (targetUserId === sub) return c.json({ error: "Cannot remove yourself" }, 400);

  await db.delete(orgMembers).where(
    and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, targetUserId)),
  );

  return c.json({ ok: true });
});

// Cancel a pending invite
teamRoutes.delete("/invites/:inviteId", async (c) => {
  const { orgId, sub } = c.get("user");
  const inviteId = c.req.param("inviteId");

  const [org] = await db
    .select({ ownerId: organizations.ownerId })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) return c.json({ error: "Organization not found" }, 404);
  if (org.ownerId !== sub) return c.json({ error: "Only the org owner can cancel invites" }, 403);

  await db.delete(orgInvites).where(
    and(eq(orgInvites.id, inviteId), eq(orgInvites.orgId, orgId)),
  );

  return c.json({ ok: true });
});

// Get invite info by token (public — used on the accept-invite page)
teamRoutes.get("/invite/:token", async (c) => {
  const token = c.req.param("token");

  const [invite] = await db
    .select({
      id: orgInvites.id,
      email: orgInvites.email,
      role: orgInvites.role,
      expiresAt: orgInvites.expiresAt,
      acceptedAt: orgInvites.acceptedAt,
      orgName: organizations.name,
    })
    .from(orgInvites)
    .innerJoin(organizations, eq(organizations.id, orgInvites.orgId))
    .where(eq(orgInvites.token, token as `${string}-${string}-${string}-${string}-${string}`))
    .limit(1);

  if (!invite) return c.json({ error: "Invite not found" }, 404);
  if (invite.acceptedAt) return c.json({ error: "Invite already accepted" }, 410);
  if (new Date(invite.expiresAt) < new Date()) return c.json({ error: "Invite expired" }, 410);

  return c.json({ invite });
});
