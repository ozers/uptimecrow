import { describe, it, expect } from "vitest";
import { appHostFromUrl, wwwRedirectTarget } from "./www-redirect.js";

const APP_HOST = "uptimecrow.com";

describe("appHostFromUrl", () => {
  it("takes the hostname out of APP_URL", () => {
    expect(appHostFromUrl("https://uptimecrow.com")).toBe("uptimecrow.com");
    expect(appHostFromUrl("https://UptimeCrow.com/path")).toBe("uptimecrow.com");
  });

  it("returns empty for missing or malformed values", () => {
    expect(appHostFromUrl(undefined)).toBe("");
    expect(appHostFromUrl("not a url")).toBe("");
  });
});

describe("wwwRedirectTarget", () => {
  it("sends the www host to the apex, keeping path and query", () => {
    expect(
      wwwRedirectTarget("http://www.uptimecrow.com/pricing?ref=hn", "www.uptimecrow.com", APP_HOST),
    ).toBe("https://uptimecrow.com/pricing?ref=hn");
  });

  it("ignores a port in the Host header", () => {
    expect(
      wwwRedirectTarget("http://www.uptimecrow.com/", "www.uptimecrow.com:443", APP_HOST),
    ).toBe("https://uptimecrow.com/");
  });

  it("leaves the apex alone", () => {
    expect(wwwRedirectTarget("https://uptimecrow.com/", "uptimecrow.com", APP_HOST)).toBeNull();
  });

  it("never touches a customer's custom status-page domain", () => {
    // These are handled by the custom-domain router; whether www.status.acme.com
    // should redirect is the customer's decision, not ours.
    expect(wwwRedirectTarget("https://status.acme.com/", "status.acme.com", APP_HOST)).toBeNull();
    expect(wwwRedirectTarget("https://www.status.acme.com/", "www.status.acme.com", APP_HOST)).toBeNull();
  });

  it("does nothing when APP_URL is unset, so self-hosters are unaffected", () => {
    expect(wwwRedirectTarget("http://www.anything.test/", "www.anything.test", "")).toBeNull();
  });

  it("keeps a plain-http visitor on http", () => {
    expect(
      wwwRedirectTarget("http://www.uptimecrow.com/docs", "www.uptimecrow.com", APP_HOST, "http"),
    ).toBe("http://uptimecrow.com/docs");
  });
});
