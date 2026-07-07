import type { Context, Next } from "hono";
import { redis } from "../db/index.js";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  prefix: string;
}

// Resolve the real client IP for rate-limit bucketing.
//
// `X-Forwarded-For` is a comma-separated chain where each proxy *appends* the
// address it saw. A client can pre-seed bogus left-most entries, so the
// left-most value is attacker-controlled and must never be trusted — using it
// (the previous behaviour) let anyone rotate their bucket and bypass the auth
// brute-force limiter. Only the right-most entries, appended by infrastructure
// we control, are trustworthy. `TRUSTED_PROXY_COUNT` (default 1) is how many
// such hops sit in front of the app; the client IP is the entry just before
// them.
export function getClientIp(c: Context): string {
  const xff = c.req.header("x-forwarded-for");
  if (xff) {
    const ips = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (ips.length > 0) {
      const trustedHops = Math.max(1, Number(process.env.TRUSTED_PROXY_COUNT ?? "1"));
      const idx = ips.length - trustedHops;
      return ips[idx >= 0 ? idx : 0];
    }
  }
  return c.req.header("x-real-ip")?.trim() || "unknown";
}

function createRateLimiter(config: RateLimitConfig) {
  return async (c: Context, next: Next) => {
    const ip = getClientIp(c);
    const key = `rl:${config.prefix}:${ip}`;
    const windowSec = Math.ceil(config.windowMs / 1000);

    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSec);
    }

    const remaining = Math.max(0, config.max - current);
    c.header("X-RateLimit-Limit", String(config.max));
    c.header("X-RateLimit-Remaining", String(remaining));

    if (current > config.max) {
      const ttl = await redis.ttl(key);
      c.header("Retry-After", String(ttl > 0 ? ttl : windowSec));
      return c.json({ error: "Too many requests. Please try again later." }, 429);
    }

    await next();
  };
}

// Auth routes: 30 req/15min in dev, 10 in prod
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 10 : 30,
  prefix: "auth",
});

// API routes: 100 requests per minute
export const apiRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  prefix: "api",
});

// Public routes: 60 requests per minute
export const publicRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  prefix: "pub",
});
