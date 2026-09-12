import { describe, it, expect } from "vitest";
import { resolveStaticPath, cacheControlFor, isKnownAppRoute, looksLikeAsset, resolveWebRoot } from "./web.js";

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

// Every unknown path used to answer 200 with the app shell. That makes a typo,
// a stale link and a missing image indistinguishable from a real page — search
// engines index the lot as soft 404s, and a missing asset (og-image.png) looks
// like it is being served.
describe("isKnownAppRoute", () => {
  it("recognises the marketing and auth routes", () => {
    for (const p of ["/", "/pricing", "/docs", "/self-host", "/changelog", "/privacy", "/terms", "/login", "/register"]) {
      expect(isKnownAppRoute(p)).toBe(true);
    }
  });

  it("recognises dashboard routes at any depth", () => {
    expect(isKnownAppRoute("/dashboard")).toBe(true);
    expect(isKnownAppRoute("/dashboard/monitors/42/edit")).toBe(true);
  });

  it("ignores a trailing slash and a query string", () => {
    expect(isKnownAppRoute("/pricing/")).toBe(true);
    expect(isKnownAppRoute("/pricing?ref=hn")).toBe(true);
  });

  it("rejects paths the app has no page for", () => {
    expect(isKnownAppRoute("/asdf")).toBe(false);
    expect(isKnownAppRoute("/dashboardy")).toBe(false);
    expect(isKnownAppRoute("/wp-admin")).toBe(false);
  });
});

describe("looksLikeAsset", () => {
  it("treats a path ending in a file extension as an asset", () => {
    expect(looksLikeAsset("/og-image.png")).toBe(true);
    expect(looksLikeAsset("/assets/index-abc123.js")).toBe(true);
    expect(looksLikeAsset("/favicon.ico")).toBe(true);
  });

  it("treats page paths as pages", () => {
    expect(looksLikeAsset("/")).toBe(false);
    expect(looksLikeAsset("/pricing")).toBe(false);
    expect(looksLikeAsset("/dashboard/monitors/42")).toBe(false);
  });
});

// Production went down because the SPA root was resolved against the working
// directory: a start command that ran `cd /app` turned "../../web" into /web,
// the API found no web app, and every page answered "404 Not Found".
describe("resolveWebRoot", () => {
  const DIST = "/app/apps/api/dist";

  it("finds /app/web from the compiled module in the image", () => {
    expect(resolveWebRoot(undefined, DIST, "/app/apps/api")).toBe("/app/web");
  });

  it("does not depend on the working directory", () => {
    const fromApiDir = resolveWebRoot(undefined, DIST, "/app/apps/api");
    expect(resolveWebRoot(undefined, DIST, "/app")).toBe(fromApiDir);
    expect(resolveWebRoot(undefined, DIST, "/")).toBe(fromApiDir);
  });

  it("uses an absolute WEB_ROOT exactly as given", () => {
    expect(resolveWebRoot("/srv/uptimecrow/web", DIST, "/app")).toBe("/srv/uptimecrow/web");
  });

  it("resolves a relative WEB_ROOT against the working directory", () => {
    expect(resolveWebRoot("../web/dist", DIST, "/repo/apps/api")).toBe("/repo/apps/web/dist");
  });
});
