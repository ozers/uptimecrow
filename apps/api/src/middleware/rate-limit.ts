import type { Context, Next } from "hono";
import { redis } from "../db/index.js";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  prefix: string;
}

function getClientIp(c: Context): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown"
  );
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

// Free tools (SSL/DNS/uptime checkers): 10 requests per minute per IP.
// Each request can hit a third-party (WHOIS/DNS/target URL), so we keep
// this tight to prevent abuse while still feeling instant for humans.
export const toolsRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  prefix: "tools",
});
