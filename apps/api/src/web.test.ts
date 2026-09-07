import { describe, it, expect } from "vitest";
import { resolveStaticPath, cacheControlFor } from "./web.js";

// These rules used to live in nginx.conf, where nothing could test them. The
// pre-rendered marketing routes (/pricing -> /pricing/index.html) and the SPA
// fallback both depend on getting the order exactly right.
const FILES = new Set([
  "/index.html",
  "/favicon.ico",
  "/robots.txt",
  "/assets/index-abc123.js",
  "/assets/index-abc123.css",
  "/pricing/index.html",
  "/docs/index.html",
  "/self-host/index.html",
]);

describe("resolveStaticPath", () => {
  it("serves the app shell at the root", () => {
    expect(resolveStaticPath("/", FILES)).toBe("/index.html");
    expect(resolveStaticPath("", FILES)).toBe("/index.html");
  });

  it("serves an exact file when one exists", () => {
    expect(resolveStaticPath("/robots.txt", FILES)).toBe("/robots.txt");
    expect(resolveStaticPath("/assets/index-abc123.js", FILES)).toBe("/assets/index-abc123.js");
  });

  it("serves a pre-rendered route without redirecting to a trailing slash", () => {
    // nginx's `$uri/` probe answered this with a 301, which fought the
    // canonical URLs and the sitemap. The file is returned directly instead.
    expect(resolveStaticPath("/pricing", FILES)).toBe("/pricing/index.html");
    expect(resolveStaticPath("/self-host", FILES)).toBe("/self-host/index.html");
  });

  it("treats a trailing slash as the same route", () => {
    expect(resolveStaticPath("/docs/", FILES)).toBe("/docs/index.html");
  });

  it("falls back to the shell for client-side routes", () => {
    // /dashboard/monitors/42 only exists inside React Router.
    expect(resolveStaticPath("/dashboard/monitors/42", FILES)).toBe("/index.html");
  });

  it("refuses to walk out of the build directory", () => {
    expect(resolveStaticPath("/../../etc/passwd", FILES)).toBe("/index.html");
    expect(resolveStaticPath("/assets/../../../etc/passwd", FILES)).toBe("/index.html");
    expect(resolveStaticPath("/%2e%2e/%2e%2e/etc/passwd", FILES)).toBe("/index.html");
    expect(resolveStaticPath("/foo\0.html", FILES)).toBe("/index.html");
  });
});

describe("cacheControlFor", () => {
  it("caches content-addressed bundles forever", () => {
    expect(cacheControlFor("/assets/index-abc123.js")).toContain("immutable");
  });

  it("never caches HTML, so a deploy is picked up on the next load", () => {
    expect(cacheControlFor("/index.html")).toBe("no-cache, must-revalidate");
    expect(cacheControlFor("/pricing/index.html")).toBe("no-cache, must-revalidate");
  });

  it("gives everything else a modest TTL", () => {
    expect(cacheControlFor("/favicon.ico")).toBe("public, max-age=3600");
  });
});
