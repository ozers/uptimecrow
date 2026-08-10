import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getProductId, buildProductMap } from "./billing.js";

// Polar identifies both the checkout target and the subscription by product id.
// These tests pin the env-var resolution order, because getting it wrong is
// invisible until a real customer hits checkout: a missing id degrades to
// "Billing not configured", and a wrong one to an upstream 422.

const KEYS = [
  "POLAR_INDIE_MONTHLY_PRODUCT_ID",
  "POLAR_INDIE_YEARLY_PRODUCT_ID",
  "POLAR_INDIE_MONTHLY_PRICE_ID",
  "POLAR_INDIE_PRODUCT_ID",
  "POLAR_PRO_MONTHLY_PRODUCT_ID",
  "POLAR_PRO_YEARLY_PRODUCT_ID",
  "POLAR_TEAM_MONTHLY_PRODUCT_ID",
  "POLAR_TEAM_YEARLY_PRODUCT_ID",
];

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  for (const k of KEYS) delete process.env[k];
});

afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe("getProductId", () => {
  it("reads the canonical POLAR_<PLAN>_<INTERVAL>_PRODUCT_ID", () => {
    process.env.POLAR_PRO_YEARLY_PRODUCT_ID = "prod-pro-year";
    expect(getProductId("pro", "yearly")).toBe("prod-pro-year");
  });

  it("falls back to the legacy ..._PRICE_ID name so a live deployment keeps working", () => {
    process.env.POLAR_INDIE_MONTHLY_PRICE_ID = "prod-indie-month";
    expect(getProductId("indie", "monthly")).toBe("prod-indie-month");
  });

  it("prefers the canonical name over the legacy one", () => {
    process.env.POLAR_INDIE_MONTHLY_PRODUCT_ID = "canonical";
    process.env.POLAR_INDIE_MONTHLY_PRICE_ID = "legacy";
    expect(getProductId("indie", "monthly")).toBe("canonical");
  });

  it("falls back to a single per-plan product for both intervals", () => {
    process.env.POLAR_INDIE_PRODUCT_ID = "prod-indie";
    expect(getProductId("indie", "monthly")).toBe("prod-indie");
    expect(getProductId("indie", "yearly")).toBe("prod-indie");
  });

  it("returns an empty string when nothing is configured", () => {
    expect(getProductId("team", "monthly")).toBe("");
  });
});

describe("buildProductMap", () => {
  it("maps each configured product id back to its plan and interval", () => {
    process.env.POLAR_INDIE_MONTHLY_PRODUCT_ID = "p-indie-m";
    process.env.POLAR_PRO_YEARLY_PRODUCT_ID = "p-pro-y";

    expect(buildProductMap()).toEqual({
      "p-indie-m": { plan: "indie", interval: "monthly" },
      "p-pro-y": { plan: "pro", interval: "yearly" },
    });
  });

  it("skips unconfigured plans instead of mapping the empty string", () => {
    process.env.POLAR_PRO_MONTHLY_PRODUCT_ID = "p-pro-m";
    const map = buildProductMap();
    expect(Object.keys(map)).toEqual(["p-pro-m"]);
    expect(map[""]).toBeUndefined();
  });

  it("labels a shared per-plan product as monthly rather than dropping it", () => {
    process.env.POLAR_INDIE_PRODUCT_ID = "p-indie";
    expect(buildProductMap()).toEqual({ "p-indie": { plan: "indie", interval: "monthly" } });
  });
});
