import { describe, it, expect } from "vitest";
import { daysUntil } from "./expiry.js";

const now = new Date("2026-07-09T12:00:00.000Z");
const H = 60 * 60 * 1000;
const D = 24 * H;

describe("daysUntil", () => {
  it("counts full days only — floor, never round", () => {
    // 1 day 18 hours out = 1 full day remaining, NOT 2.
    // `Math.round` would return 2 here, which is the bug this guards against.
    expect(daysUntil(new Date(now.getTime() + D + 18 * H), now)).toBe(1);
  });

  it("returns whole days for exact multiples", () => {
    expect(daysUntil(new Date(now.getTime() + 30 * D), now)).toBe(30);
  });

  it("returns 0 for anything expiring within the next 24h (expiring today)", () => {
    // 20 hours out is still 0 full days left — `Math.round` would wrongly say 1d.
    expect(daysUntil(new Date(now.getTime() + 20 * H), now)).toBe(0);
    expect(daysUntil(new Date(now.getTime() + 1 * H), now)).toBe(0);
  });

  it("goes negative once the timestamp is in the past (expired)", () => {
    expect(daysUntil(new Date(now.getTime() - 1 * H), now)).toBe(-1);
    expect(daysUntil(new Date(now.getTime() - 2 * D), now)).toBe(-2);
  });

  it("matches the alerting threshold at the boundary (< threshold fires)", () => {
    // Cert with just under 14 full days should count as 13, so a
    // `daysRemaining < 14` warning fires — round() would return 14 and miss it.
    expect(daysUntil(new Date(now.getTime() + 14 * D - 1 * H), now)).toBe(13);
  });
});
