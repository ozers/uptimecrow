import { describe, it, expect } from "vitest";
import { computeCutoffs } from "./retention.job.js";
import { PLAN_LIMITS } from "@uptimecrow/shared";

describe("computeCutoffs", () => {
  it("returns a cutoff for every plan tier", () => {
    const cutoffs = computeCutoffs();
    expect(cutoffs.map((c) => c.plan).sort()).toEqual(["free", "indie", "pro", "team"]);
  });

  it("cutoff equals now minus plan retentionDays", () => {
    const now = new Date("2026-04-13T12:00:00.000Z");
    const cutoffs = computeCutoffs(now);

    for (const { plan, cutoff } of cutoffs) {
      const expected = now.getTime() - PLAN_LIMITS[plan].retentionDays * 86_400_000;
      expect(cutoff.getTime()).toBe(expected);
    }
  });

  it("free tier prunes at 60 days", () => {
    const now = new Date("2026-04-13T00:00:00.000Z");
    const cutoffs = computeCutoffs(now);
    const free = cutoffs.find((c) => c.plan === "free")!;
    // 60 days back from 2026-04-13 is 2026-02-12
    expect(free.cutoff.toISOString()).toBe("2026-02-12T00:00:00.000Z");
  });

  it("team tier retains a full year", () => {
    const now = new Date("2026-04-13T00:00:00.000Z");
    const cutoffs = computeCutoffs(now);
    const team = cutoffs.find((c) => c.plan === "team")!;
    // 365 days back from 2026-04-13 is 2025-04-13
    expect(team.cutoff.toISOString()).toBe("2025-04-13T00:00:00.000Z");
  });

  it("free cutoff is more recent than pro/team; team has the oldest cutoff", () => {
    const cutoffs = computeCutoffs();
    const free = cutoffs.find((c) => c.plan === "free")!.cutoff.getTime();
    const pro = cutoffs.find((c) => c.plan === "pro")!.cutoff.getTime();
    const team = cutoffs.find((c) => c.plan === "team")!.cutoff.getTime();
    // free = 60d, pro/indie = 90d, team = 365d
    expect(free).toBeGreaterThan(pro);
    expect(pro).toBeGreaterThan(team);
  });
});
