import { describe, it, expect } from "vitest";
import { computeCutoffs } from "./retention.job.js";
import { PLAN_LIMITS, PLANS } from "@uptimecrow/shared";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("computeCutoffs", () => {
  it("returns a cutoff for every plan tier", () => {
    const cutoffs = computeCutoffs();
    expect(cutoffs.map((c) => c.plan).sort()).toEqual([...PLANS].sort());
  });

  it("cutoff equals now minus plan retentionDays", () => {
    const now = new Date("2026-04-13T12:00:00.000Z");
    const cutoffs = computeCutoffs(now);

    for (const { plan, cutoff } of cutoffs) {
      const expected = now.getTime() - PLAN_LIMITS[plan].retentionDays * DAY_MS;
      expect(cutoff.getTime()).toBe(expected);
    }
  });

  it("free has the shortest retention window of all tiers", () => {
    const cutoffs = computeCutoffs();
    const free = cutoffs.find((c) => c.plan === "free")!.cutoff.getTime();
    for (const plan of PLANS) {
      if (plan === "free") continue;
      const other = cutoffs.find((c) => c.plan === plan)!.cutoff.getTime();
      // Shorter retention window = more recent cutoff = higher timestamp.
      expect(free).toBeGreaterThanOrEqual(other);
    }
  });
});
