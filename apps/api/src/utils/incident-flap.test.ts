import { describe, it, expect } from "vitest";
import { isWithinFlapCooldown, FLAP_COOLDOWN_MS } from "./incident-flap.js";

describe("isWithinFlapCooldown", () => {
  const now = new Date("2026-07-09T12:00:00.000Z").getTime();

  it("no prior resolved incident → open a fresh one", () => {
    expect(isWithinFlapCooldown(null, now)).toBe(false);
  });

  it("resolved a second ago → reopen (flapping)", () => {
    expect(isWithinFlapCooldown(new Date(now - 1000), now)).toBe(true);
  });

  it("resolved 14 minutes ago → still within the 15-minute window", () => {
    expect(isWithinFlapCooldown(new Date(now - 14 * 60 * 1000), now)).toBe(true);
  });

  it("resolved exactly at the boundary → open a fresh one (exclusive)", () => {
    expect(isWithinFlapCooldown(new Date(now - FLAP_COOLDOWN_MS), now)).toBe(false);
  });

  it("resolved two hours ago → not flapping, open a fresh one", () => {
    expect(isWithinFlapCooldown(new Date(now - 2 * 60 * 60 * 1000), now)).toBe(false);
  });
});
