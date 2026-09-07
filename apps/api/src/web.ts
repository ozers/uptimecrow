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
import { serveStatic } from "@hono/node-server/serve-static";
import type { Hono } from "hono";
import { logger } from "./utils/logger.js";

// `serveStatic` resolves `root` relative to process.cwd(), so the default is
// expressed that way too: the production image copies the built SPA to
// /app/web and runs from /app/apps/api.
const DEFAULT_WEB_ROOT = "../../web";

export function webRoot(): string {
  return process.env.WEB_ROOT || DEFAULT_WEB_ROOT;
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

// The nginx `try_files $uri $uri.html $uri/index.html /index.html` rule, ported
// so it can be tested. `$uri/` is deliberately absent: nginx answers that with a
// 301 to a trailing slash, which fights the canonical URLs and the sitemap.
//
// Returns the file to serve, or "/index.html" for the SPA fallback — an unknown
// path is a client-side route, not a 404, and React Router decides.
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
  const root = webRoot();
  const abs = path.resolve(process.cwd(), root);

  if (!existsSync(path.join(abs, "index.html"))) {
    logger.info(`[Web] No SPA build at ${abs} — serving API only`);
    return false;
  }

  const files = buildFileIndex(abs);
  logger.info(`[Web] Serving ${files.size} static files from ${abs}`);

  // Mounted last, so every API, status, badge and health route above wins.
  app.get("*", async (c, next) => {
    const target = resolveStaticPath(c.req.path, files);
    c.header("Cache-Control", cacheControlFor(target));
    return serveStatic({ root, rewriteRequestPath: () => target })(c, next);
  });

  return true;
}
