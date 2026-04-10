import { Hono } from "hono";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, organizations } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

export const billingRoutes = new Hono();

// ─── LemonSqueezy ─────────────────────────────────────────────────────────────

const LS_API_KEY = () => process.env.LEMONSQUEEZY_API_KEY || "";
const LS_STORE_ID = () => process.env.LEMONSQUEEZY_STORE_ID || "";
const LS_WEBHOOK_SECRET = () => process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";

const LS_VARIANT_IDS: Record<string, string> = {
  pro: process.env.LS_PRO_VARIANT_ID || "",
  team: process.env.LS_TEAM_VARIANT_ID || "",
};

// ─── Polar ────────────────────────────────────────────────────────────────────

const POLAR_API = "https://api.polar.sh/v1";
const POLAR_TOKEN = () => process.env.POLAR_ACCESS_TOKEN || "";
const POLAR_WEBHOOK_SECRET = () => process.env.POLAR_WEBHOOK_SECRET || "";

const POLAR_PRODUCT_IDS: Record<string, string> = {
  pro: process.env.POLAR_PRO_PRODUCT_ID || "",
  team: process.env.POLAR_TEAM_PRODUCT_ID || "",
};

// Create checkout URL
billingRoutes.post("/checkout", authMiddleware, async (c) => {
  const { sub, email } = c.get("user");
  const { plan } = await c.req.json<{ plan: "pro" | "team" }>();

  const variantId = LS_VARIANT_IDS[plan];
  if (!variantId) return c.json({ error: "Invalid plan" }, 400);

  const apiKey = LS_API_KEY();
  if (!apiKey) return c.json({ error: "Billing not configured" }, 500);

  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email,
            custom: { user_id: sub },
          },
          product_options: {
            redirect_url: `${process.env.APP_URL || "http://localhost:5173"}/dashboard/settings?billing=success`,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: LS_STORE_ID() } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[Billing] Checkout creation failed:", err);
    return c.json({ error: "Failed to create checkout" }, 500);
  }

  const data = await res.json();
  const checkoutUrl = data.data?.attributes?.url;

  return c.json({ checkoutUrl });
});

// Get customer portal URL
billingRoutes.post("/portal", authMiddleware, async (c) => {
  const { sub } = c.get("user");

  const [user] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, sub))
    .limit(1);

  if (!user?.stripeCustomerId) {
    return c.json({ error: "No active subscription" }, 400);
  }

  const apiKey = LS_API_KEY();
  const res = await fetch(`https://api.lemonsqueezy.com/v1/customers/${user.stripeCustomerId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/vnd.api+json",
    },
  });

  if (!res.ok) return c.json({ error: "Failed to fetch customer" }, 500);

  const data = await res.json();
  const portalUrl = data.data?.attributes?.urls?.customer_portal;

  if (!portalUrl) return c.json({ error: "Portal URL not available" }, 500);

  return c.json({ portalUrl });
});

// LemonSqueezy webhook handler (no auth — verified by signature)
billingRoutes.post("/webhook", async (c) => {
  const secret = LS_WEBHOOK_SECRET();
  if (!secret) return c.json({ error: "Webhook not configured" }, 500);

  const rawBody = await c.req.text();
  const signature = c.req.header("x-signature");

  if (!signature) return c.json({ error: "No signature" }, 401);

  const hmac = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (hmac !== signature) return c.json({ error: "Invalid signature" }, 401);

  const event = JSON.parse(rawBody);
  const eventName = event.meta?.event_name;
  const userId = event.meta?.custom_data?.user_id;
  const customerId = String(event.data?.attributes?.customer_id || "");

  console.log(`[Billing] Webhook: ${eventName} for user ${userId}`);

  if (!userId) return c.json({ ok: true });

  switch (eventName) {
    case "subscription_created":
    case "subscription_updated": {
      const variantId = String(event.data?.attributes?.variant_id || "");
      const status = event.data?.attributes?.status;
      const plan = Object.entries(LS_VARIANT_IDS).find(([, v]) => v === variantId)?.[0] as "pro" | "team" | undefined;

      if (plan && (status === "active" || status === "on_trial")) {
        await db.update(users).set({ plan, stripeCustomerId: customerId }).where(eq(users.id, userId));
        await db.update(organizations).set({ plan }).where(eq(organizations.ownerId, userId));
        console.log(`[Billing] Upgraded ${userId} to ${plan}`);
      }
      break;
    }

    case "subscription_cancelled":
    case "subscription_expired": {
      await db.update(users).set({ plan: "free", stripeCustomerId: null }).where(eq(users.id, userId));
      await db.update(organizations).set({ plan: "free" }).where(eq(organizations.ownerId, userId));
      console.log(`[Billing] Downgraded ${userId} to free`);
      break;
    }
  }

  return c.json({ ok: true });
});

// ─── Polar: Create checkout ───────────────────────────────────────────────────

billingRoutes.post("/polar/checkout", authMiddleware, async (c) => {
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
    console.error("[Polar] Checkout error:", err);
    return c.json({ error: "Failed to create checkout" }, 500);
  }

  const data = await res.json();
  return c.json({ checkoutUrl: data.url });
});

// ─── Polar: Webhook ───────────────────────────────────────────────────────────
// Uses Standard Webhooks (standardwebhooks.com) — signature: HMAC-SHA256 of
// "{webhook-id}.{webhook-timestamp}.{body}", base64-encoded, secret is base64.

billingRoutes.post("/polar/webhook", async (c) => {
  const secret = POLAR_WEBHOOK_SECRET();
  if (!secret) return c.json({ error: "Webhook not configured" }, 500);

  const rawBody = await c.req.text();
  const msgId = c.req.header("webhook-id") || "";
  const msgTimestamp = c.req.header("webhook-timestamp") || "";
  const msgSignature = c.req.header("webhook-signature") || "";

  // Verify timestamp is within 5 minutes (replay protection)
  const ts = Number(msgTimestamp);
  if (Math.abs(Date.now() / 1000 - ts) > 300) {
    return c.json({ error: "Timestamp too old" }, 401);
  }

  // Verify signature
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

  console.log(`[Polar] Webhook: ${eventType} for user ${userId}`);
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
        console.log(`[Polar] Upgraded ${userId} to ${plan}`);
      }
      break;
    }

    case "subscription.canceled":
    case "subscription.revoked": {
      await db.update(users).set({ plan: "free", stripeCustomerId: null }).where(eq(users.id, userId));
      await db.update(organizations).set({ plan: "free" }).where(eq(organizations.ownerId, userId));
      console.log(`[Polar] Downgraded ${userId} to free`);
      break;
    }
  }

  return c.json({ ok: true });
});
