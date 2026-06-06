import { describe, it, expect, afterEach } from "vitest";
import type { Context } from "hono";
import { getClientIp } from "./rate-limit.js";

// Build a minimal Context stub that only exposes the request headers
// getClientIp reads. Header lookups are case-insensitive in Hono, and the
// callers always use lowercase keys.
function ctx(headers: Record<string, string>): Context {
  return {
    req: {
      header: (name: string) => headers[name.toLowerCase()],
    },
  } as unknown as Context;
}

describe("getClientIp", () => {
  const original = process.env.TRUSTED_PROXY_COUNT;
  afterEach(() => {
    if (original === undefined) delete process.env.TRUSTED_PROXY_COUNT;
    else process.env.TRUSTED_PROXY_COUNT = original;
  });

  it("falls back to 'unknown' when no IP headers are present", () => {
    expect(getClientIp(ctx({}))).toBe("unknown");
  });

  it("uses x-real-ip when there is no x-forwarded-for", () => {
    expect(getClientIp(ctx({ "x-real-ip": "203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("returns the single forwarded IP behind one trusted proxy", () => {
    expect(getClientIp(ctx({ "x-forwarded-for": "203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("ignores a client-spoofed left-most XFF entry (the bypass)", () => {
    // Attacker pre-seeds "1.2.3.4"; our single proxy appends the real peer.
    // The real client is the right-most entry, not the spoofed left-most one.
    expect(
      getClientIp(ctx({ "x-forwarded-for": "1.2.3.4, 203.0.113.7" })),
    ).toBe("203.0.113.7");
  });

  it("does not let a long spoofed chain rotate the bucket", () => {
    const spoofed = "9.9.9.1, 9.9.9.2, 9.9.9.3, 203.0.113.7";
    expect(getClientIp(ctx({ "x-forwarded-for": spoofed }))).toBe("203.0.113.7");
  });

  it("honours TRUSTED_PROXY_COUNT for multiple real proxies", () => {
    process.env.TRUSTED_PROXY_COUNT = "2";
    // Two trusted hops (e.g. CDN + nginx) append the two right-most entries.
    // The real client sits just to their left; the further-left "1.2.3.4" is
    // client-spoofed and must be ignored.
    expect(
      getClientIp(ctx({ "x-forwarded-for": "1.2.3.4, 203.0.113.7, 10.0.0.2" })),
    ).toBe("203.0.113.7");
  });

  it("clamps to the left-most entry if the chain is shorter than the hop count", () => {
    process.env.TRUSTED_PROXY_COUNT = "3";
    expect(getClientIp(ctx({ "x-forwarded-for": "203.0.113.7" }))).toBe("203.0.113.7");
  });
});
