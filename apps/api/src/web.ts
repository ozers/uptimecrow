// Serving the built SPA from the API process.
//
// The web app used to ship as its own nginx container whose config duplicated
// routing knowledge the API already has: which prefixes are API routes, which
// are proxied, how a pre-rendered route file maps to a URL. That duplication is
// what left GET /badge/<slug>.svg 404ing for months — nginx forwarded it and
// nothing was mounted there. Serving the same files from Hono collapses the two
// halves into one image with one router, and self-hosters get one fewer moving
// part.
//
// Nothing here is required: if the dist directory is missing (running the API
// against a Vite dev server, or MODE=worker) the app simply does not mount it.

import { readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serveStatic } from "@hono/node-server/serve-static";
import type { Hono } from "hono";
import { logger } from "./utils/logger.js";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

// Where the built SPA lives. The default is resolved from this module's own
// location — never from the working directory. It used to be "../../web"
// relative to process.cwd(), and a Railway start command that ran `cd /app`
// moved it to /web: the API came up with no web app, and every page on the
// production site answered "404 Not Found".
//
// In the image this module is /app/apps/api/dist/web.js, so ../../../web is
// /app/web. An explicit WEB_ROOT still means what it says: absolute as-is,
// relative against the working directory.
export function resolveWebRoot(
  envValue: string | undefined,
  moduleDir: string,
  cwd: string,
): string {
  if (envValue) return path.resolve(cwd, envValue);
  return path.resolve(moduleDir, "../../../web");
}

// Walk the build output once at startup. The tree is immutable after `vite
// build`, so an index beats an existsSync() per request, and it keeps the
// path-resolution rules below a pure function over a Set.
export function buildFileIndex(root: string): Set<string> {
  const files = new Set<string>();
  const walk = (dir: string, prefix: string) => {
    for (const entry of readdirSync(dir)) {
      const abs = path.join(dir, entry);
      const rel = `${prefix}/${entry}`;
      if (statSync(abs).isDirectory()) walk(abs, rel);
      else files.add(rel);
    }
  };
  walk(root, "");
  return files;
}

// Paths the SPA owns. Anything outside this list has no page behind it, so the
// shell is still served (the app renders its not-found screen) but with a 404
// status — otherwise every typo and every stale link is a soft 404 that search
// engines happily index. Must stay in sync with the routes in apps/web/src/App.tsx.
const APP_ROUTES = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/privacy",
  "/terms",
  "/docs",
  "/pricing",
  "/self-host",
  "/changelog",
]);
const APP_ROUTE_PREFIXES = ["/dashboard"];

export function isKnownAppRoute(urlPath: string): boolean {
  const clean = (urlPath.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  if (APP_ROUTES.has(clean)) return true;
  return APP_ROUTE_PREFIXES.some((p) => clean === p || clean.startsWith(`${p}/`));
}

// A path with a file extension is asking for an asset, not a page. Handing it
// the HTML shell with a 200 is how a missing og-image.png looked fine for weeks:
// every share was imageless while the URL answered "OK".
export function looksLikeAsset(urlPath: string): boolean {
  const last = (urlPath.split("?")[0] || "").split("/").pop() || "";
  return /\.[a-z0-9]{2,5}$/i.test(last);
}

// The nginx `try_files $uri $uri.html $uri/index.html /index.html` rule, ported
// so it can be tested. `$uri/` is deliberately absent: nginx answers that with a
// 301 to a trailing slash, which fights the canonical URLs and the sitemap.
//
// Returns the file to serve, or "/index.html" for the SPA fallback.
export function resolveStaticPath(urlPath: string, files: Set<string>): string {
  const clean = decodeURIComponent(urlPath.split("?")[0]);

  // Path traversal and NUL bytes never reach the filesystem. serveStatic
  // guards too; this keeps the rule visible where the routing lives.
  if (clean.includes("\0") || clean.split("/").includes("..")) return "/index.html";

  if (clean === "" || clean === "/") return "/index.html";
  const uri = clean.endsWith("/") ? clean.slice(0, -1) : clean;

  if (files.has(uri)) return uri;
  if (files.has(`${uri}.html`)) return `${uri}.html`;
  if (files.has(`${uri}/index.html`)) return `${uri}/index.html`;
  return "/index.html";
}

// Hashed build assets are content-addressed, so they can be cached forever.
// Every HTML response must not be, or a deploy that references new bundle
// hashes is invisible until the browser cache expires.
export function cacheControlFor(filePath: string): string {
  if (filePath.startsWith("/assets/")) return "public, max-age=31536000, immutable";
  if (filePath.endsWith(".html")) return "no-cache, must-revalidate";
  return "public, max-age=3600";
}

export function mountWebApp(app: Hono): boolean {
  const abs = resolveWebRoot(process.env.WEB_ROOT, MODULE_DIR, process.cwd());

  if (!existsSync(path.join(abs, "index.html"))) {
    logger.info(`[Web] No SPA build at ${abs} — serving API only`);
    return false;
  }

  const files = buildFileIndex(abs);
  logger.info(`[Web] Serving ${files.size} static files from ${abs}`);

  // Mounted last, so every API, status, badge and health route above wins.
  app.get("*", async (c, next) => {
    const reqPath = c.req.path;
    const target = resolveStaticPath(reqPath, files);
    const missing = target === "/index.html" && !files.has(reqPath);

    // A missing file gets a real 404 instead of the HTML shell.
    if (missing && looksLikeAsset(reqPath)) {
      return c.text("Not found", 404);
    }

    c.header("Cache-Control", cacheControlFor(target));
    // An absolute root: serveStatic joins it with the file path, so the working
    // directory can no longer change what gets served.
    const res = await serveStatic({ root: abs, rewriteRequestPath: () => target })(c, next);

    // Unknown page: the shell still renders so the app can show its not-found
    // screen, but the status tells crawlers there is nothing here.
    if (missing && !isKnownAppRoute(reqPath) && res instanceof Response) {
      return new Response(res.body, { status: 404, headers: res.headers });
    }
    return res;
  });

  return true;
}
