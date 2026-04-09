import { Hono } from "hono";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, organizations } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

export const billingRoutes = new Hono();

const LS_API_KEY = () => process.env.LEMONSQUEEZY_API_KEY || "";
const LS_STORE_ID = () => process.env.LEMONSQUEEZY_STORE_ID || "";
const LS_WEBHOOK_SECRET = () => process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";

// Variant IDs — set these in .env or hardcode after creating products in LemonSqueezy
const VARIANT_IDS: Record<string, string> = {
  pro: process.env.LS_PRO_VARIANT_ID || "",
  team: process.env.LS_TEAM_VARIANT_ID || "",
};

// Create checkout URL
billingRoutes.post("/checkout", authMiddleware, async (c) => {
  const { sub, email } = c.get("user");
  const { plan } = await c.req.json<{ plan: "pro" | "team" }>();

  const variantId = VARIANT_IDS[plan];
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
      const plan = Object.entries(VARIANT_IDS).find(([, v]) => v === variantId)?.[0] as "pro" | "team" | undefined;

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
