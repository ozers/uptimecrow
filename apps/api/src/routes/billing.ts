import { Hono, type Context } from "hono";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, organizations } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

export const billingRoutes = new Hono();

const POLAR_API = "https://api.polar.sh/v1";
const POLAR_TOKEN = () => process.env.POLAR_ACCESS_TOKEN || "";
const POLAR_WEBHOOK_SECRET = () => process.env.POLAR_WEBHOOK_SECRET || "";

const POLAR_PRODUCT_IDS: Record<string, string> = {
  pro: process.env.POLAR_PRO_PRODUCT_ID || "",
  team: process.env.POLAR_TEAM_PRODUCT_ID || "",
};

billingRoutes.post("/checkout", authMiddleware, async (c) => {
  const { sub, email } = c.get("user");
  const { plan } = await c.req.json<{ plan: "pro" | "team" }>();

  const productId = POLAR_PRODUCT_IDS[plan];
  if (!productId) return c.json({ error: "Billing not configured" }, 400);

  const token = POLAR_TOKEN();
  if (!token) return c.json({ error: "Billing not configured" }, 500);

  const res = await fetch(`${POLAR_API}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: productId,
      success_url: `${process.env.APP_URL || "http://localhost:5173"}/dashboard/settings?billing=success`,
      customer_email: email,
      metadata: { user_id: sub },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    logger.error({ err }, "[Polar] Checkout error");
    return c.json({ error: "Failed to create checkout" }, 500);
  }

  const data = await res.json();
  return c.json({ checkoutUrl: data.url });
});

billingRoutes.post("/portal", authMiddleware, async (c) => {
  const { sub } = c.get("user");

  const [user] = await db
    .select({ customerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, sub))
    .limit(1);

  if (!user?.customerId) {
    return c.json({ error: "No active subscription" }, 400);
  }

  const token = POLAR_TOKEN();
  if (!token) return c.json({ error: "Billing not configured" }, 500);

  const res = await fetch(`${POLAR_API}/customer-sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ customer_id: user.customerId }),
  });

  if (!res.ok) {
    const err = await res.text();
    logger.error({ err }, "[Polar] Portal session error");
    return c.json({ error: "Failed to open billing portal" }, 500);
  }

  const data = await res.json();
  const portalUrl: string | undefined = data.customer_portal_url;
  if (!portalUrl) return c.json({ error: "Portal URL not available" }, 500);

  return c.json({ portalUrl });
});

async function handlePolarWebhook(c: Context) {
  const secret = POLAR_WEBHOOK_SECRET();
  if (!secret) return c.json({ error: "Webhook not configured" }, 500);

  const rawBody = await c.req.text();
  const msgId = c.req.header("webhook-id") || "";
  const msgTimestamp = c.req.header("webhook-timestamp") || "";
  const msgSignature = c.req.header("webhook-signature") || "";

  const ts = Number(msgTimestamp);
  if (Math.abs(Date.now() / 1000 - ts) > 300) {
    return c.json({ error: "Timestamp too old" }, 401);
  }

  const toSign = `${msgId}.${msgTimestamp}.${rawBody}`;
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto.createHmac("sha256", secretBytes).update(toSign).digest("base64");
  const signatures = msgSignature.split(" ");
  const valid = signatures.some((s) => s === `v1,${expected}`);

  if (!valid) return c.json({ error: "Invalid signature" }, 401);

  const event = JSON.parse(rawBody);
  const eventType: string = event.type;
  const userId: string | undefined = event.data?.metadata?.user_id;
  const customerId = String(event.data?.customer_id || "");

  logger.info(`[Polar] Webhook: ${eventType} for user ${userId}`);
  if (!userId) return c.json({ ok: true });

  switch (eventType) {
    case "subscription.created":
    case "subscription.updated": {
      const productId = String(event.data?.product_id || "");
      const status: string = event.data?.status;
      const plan = Object.entries(POLAR_PRODUCT_IDS).find(([, v]) => v === productId)?.[0] as "pro" | "team" | undefined;

      if (plan && (status === "active" || status === "trialing")) {
        await db.update(users).set({ plan, stripeCustomerId: customerId }).where(eq(users.id, userId));
        await db.update(organizations).set({ plan }).where(eq(organizations.ownerId, userId));
        logger.info(`[Polar] Upgraded ${userId} to ${plan}`);
      }
      break;
    }

    case "subscription.canceled":
    case "subscription.revoked": {
      await db.update(users).set({ plan: "free", stripeCustomerId: null }).where(eq(users.id, userId));
      await db.update(organizations).set({ plan: "free" }).where(eq(organizations.ownerId, userId));
      logger.info(`[Polar] Downgraded ${userId} to free`);
      break;
    }
  }

  return c.json({ ok: true });
}

billingRoutes.post("/webhook", (c) => handlePolarWebhook(c));
// Legacy path — older Polar dashboards may still point here.
billingRoutes.post("/polar/webhook", (c) => handlePolarWebhook(c));
