import { Hono, type Context } from "hono";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, organizations } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";
import { track } from "../utils/beacon.js";

export const billingRoutes = new Hono();

const POLAR_API = "https://api.polar.sh/v1";
const POLAR_TOKEN = () => process.env.POLAR_ACCESS_TOKEN || "";
const POLAR_WEBHOOK_SECRET = () => process.env.POLAR_WEBHOOK_SECRET || "";

type PaidPlan = "indie" | "pro" | "team";
type BillingInterval = "monthly" | "yearly";

// Polar identifies checkout targets and subscriptions by PRODUCT id — the
// price-level ids this code used to pass were dropped from the API (a checkout
// body with `product_price_id` is now a 422, and a subscription webhook carries
// no `price_id` at all). Monthly and yearly are separate Polar products, hence
// one env var per (plan, interval).
//
// `POLAR_<PLAN>_<INTERVAL>_PRODUCT_ID` is the canonical name. The old
// `..._PRICE_ID` names are still read so an existing deployment keeps working
// once the values are swapped to product ids, and `POLAR_<PLAN>_PRODUCT_ID`
// covers a single-product plan with no separate yearly product.
const PAID_PLANS: PaidPlan[] = ["indie", "pro", "team"];
const INTERVALS: BillingInterval[] = ["monthly", "yearly"];

export function getProductId(plan: PaidPlan, interval: BillingInterval): string {
  const P = plan.toUpperCase();
  const I = interval.toUpperCase();
  return (
    process.env[`POLAR_${P}_${I}_PRODUCT_ID`] ||
    process.env[`POLAR_${P}_${I}_PRICE_ID`] ||
    process.env[`POLAR_${P}_PRODUCT_ID`] ||
    ""
  );
}

// product_id → plan mapping, used to resolve subscription webhooks back to a plan.
export function buildProductMap(): Record<string, { plan: PaidPlan; interval: BillingInterval }> {
  const map: Record<string, { plan: PaidPlan; interval: BillingInterval }> = {};
  for (const plan of PAID_PLANS) {
    for (const interval of INTERVALS) {
      const id = getProductId(plan, interval);
      // First writer wins: with a single POLAR_<PLAN>_PRODUCT_ID both intervals
      // resolve to the same id and monthly is the honest label.
      if (id && !map[id]) map[id] = { plan, interval };
    }
  }
  return map;
}

// POST /api/billing/checkout
billingRoutes.post("/checkout", authMiddleware, async (c) => {
  const { sub, email } = c.get("user");
  const { plan, interval = "monthly" } = await c.req.json<{ plan: PaidPlan; interval?: BillingInterval }>();

  if (!PAID_PLANS.includes(plan) || !INTERVALS.includes(interval)) {
    return c.json({ error: "Unknown plan" }, 400);
  }

  const productId = getProductId(plan, interval);
  if (!productId) return c.json({ error: "Billing not configured" }, 400);

  const token = POLAR_TOKEN();
  if (!token) return c.json({ error: "Billing not configured" }, 500);

  let res: Response;
  try {
    res = await fetch(`${POLAR_API}/checkouts/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        products: [productId],
        success_url: `${process.env.APP_URL || "http://localhost:5173"}/dashboard/settings?billing=success`,
        customer_email: email,
        metadata: { user_id: sub },
      }),
    });
  } catch (e) {
    logger.error({ err: String(e), plan, interval }, "[Polar] Checkout request failed");
    return c.json({ error: "Could not reach the billing provider" }, 502);
  }

  if (!res.ok) {
    const err = await res.text();
    logger.error({ status: res.status, err, plan, interval, productId }, "[Polar] Checkout error");
    // Surface the upstream reason. Polar returns validation/auth messages (not
    // secrets) and the caller is an authenticated user acting on their own org,
    // so exposing the detail turns an opaque 500 into something diagnosable.
    let detail: string;
    try {
      const j = JSON.parse(err);
      const d = j?.detail ?? j?.error ?? j?.message ?? err;
      detail = typeof d === "string" ? d : JSON.stringify(d);
    } catch {
      detail = err;
    }
    return c.json({ error: "Failed to create checkout", status: res.status, detail: detail.slice(0, 400) }, 500);
  }

  const data = await res.json().catch(() => null);
  if (!data?.url) {
    logger.error({ data }, "[Polar] Checkout: missing url in response");
    return c.json({ error: "Checkout created but no URL was returned" }, 500);
  }
  return c.json({ checkoutUrl: data.url });
});

// POST /api/billing/portal
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

  const res = await fetch(`${POLAR_API}/customer-sessions/`, {
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

// Webhook handler
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
  const valid = msgSignature.split(" ").some((s) => s === `v1,${expected}`);

  if (!valid) return c.json({ error: "Invalid signature" }, 401);

  const event = JSON.parse(rawBody);
  const eventType: string = event.type;
  const userId: string | undefined = event.data?.metadata?.user_id;
  const customerId = String(event.data?.customer_id || "");
  // Subscription payloads carry product_id; `prices[0].product_id` is the
  // fallback for order events that nest the product one level down.
  const productId = String(
    event.data?.product_id || event.data?.product?.id || event.data?.prices?.[0]?.product_id || "",
  );

  logger.info(`[Polar] Webhook: ${eventType} productId=${productId} user=${userId}`);
  if (!userId) return c.json({ ok: true });

  const productMap = buildProductMap();

  switch (eventType) {
    case "subscription.created":
    case "subscription.updated": {
      const status: string = event.data?.status;
      const entry = productMap[productId];

      if (entry && (status === "active" || status === "trialing")) {
        // read previous plan so beacon only fires on a real change, not renewals
        const [prev] = await db.select({ plan: users.plan }).from(users).where(eq(users.id, userId)).limit(1);
        await db.update(users).set({ plan: entry.plan, stripeCustomerId: customerId }).where(eq(users.id, userId));
        await db.update(organizations).set({ plan: entry.plan }).where(eq(organizations.ownerId, userId));
        logger.info(`[Polar] Upgraded ${userId} to ${entry.plan} (${entry.interval})`);
        if (prev?.plan !== entry.plan) track("subscription_started", { plan: entry.plan, interval: entry.interval, from: prev?.plan ?? "free" }, userId);
      }
      break;
    }

    case "subscription.canceled":
    case "subscription.revoked": {
      await db.update(users).set({ plan: "free", stripeCustomerId: null }).where(eq(users.id, userId));
      await db.update(organizations).set({ plan: "free" }).where(eq(organizations.ownerId, userId));
      logger.info(`[Polar] Downgraded ${userId} to free`);
      track("subscription_canceled", { type: eventType }, userId);
      break;
    }
  }

  return c.json({ ok: true });
}

billingRoutes.post("/webhook", (c) => handlePolarWebhook(c));
billingRoutes.post("/polar/webhook", (c) => handlePolarWebhook(c));
