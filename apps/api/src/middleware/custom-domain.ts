import type { Context, Next } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { statusPages } from "../db/schema.js";

// Primary hostnames we never treat as a custom domain. We derive them from
// APP_URL and STATUS_PAGE_URL at startup and also hard-code "localhost" so
// local dev on any port is a no-op.
function buildPrimaryHosts(): Set<string> {
  const primaries = new Set<string>(["localhost"]);
  for (const url of [process.env.APP_URL, process.env.STATUS_PAGE_URL]) {
    if (!url) continue;
    try {
      primaries.add(new URL(url).hostname.toLowerCase());
    } catch {
      // ignore malformed URLs in env
    }
  }
  return primaries;
}

const PRIMARY_HOSTS = buildPrimaryHosts();

// Small TTL cache so random Host headers from port scanners don't hammer the
// database. Positive hits last 5 minutes; negative hits are shorter to pick up
// newly-configured custom domains quickly.
interface CacheEntry {
  slug: string | null;
  expires: number;
}
const CACHE = new Map<string, CacheEntry>();
const POSITIVE_TTL_MS = 5 * 60_000;
const NEGATIVE_TTL_MS = 30_000;
const CACHE_MAX = 1000;

function cacheGet(host: string): CacheEntry | null {
  const entry = CACHE.get(host);
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    CACHE.delete(host);
    return null;
  }
  return entry;
}

function cacheSet(host: string, slug: string | null) {
  if (CACHE.size >= CACHE_MAX) {
    // Naive eviction — drop the oldest insertion. Good enough for this cache.
    const firstKey = CACHE.keys().next().value;
    if (firstKey) CACHE.delete(firstKey);
  }
  CACHE.set(host, {
    slug,
    expires: Date.now() + (slug ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS),
  });
}

// Strict hostname validator: each label is 1-63 chars, starts/ends with a
// letter or digit, and contains only [a-z0-9-] internally. Requires at least
// two labels (a TLD). Rejects underscores, IP-address shorthand, and obvious
// injection attempts.
const LABEL = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?";
const HOSTNAME_RE = new RegExp(`^${LABEL}(?:\\.${LABEL})+$`);

export function isValidCustomDomainFormat(raw: string): boolean {
  if (!raw) return false;
  const lower = raw.toLowerCase().split(":")[0].trim();
  if (lower.length === 0 || lower.length > 253) return false;
  if (PRIMARY_HOSTS.has(lower)) return false;
  return HOSTNAME_RE.test(lower);
}

export function normalizeHost(raw: string | undefined): string {
  return (raw || "").toLowerCase().split(":")[0].trim();
}

export function __resetCacheForTests() {
  CACHE.clear();
}

export function customDomainRouter(appRef: { fetch: (req: Request) => Promise<Response> | Response }) {
  return async (c: Context, next: Next) => {
    const host = normalizeHost(c.req.header("host"));

    // Skip for primary hosts and known reserved path prefixes that never
    // belong to a status page.
    if (
      PRIMARY_HOSTS.has(host) ||
      c.req.path.startsWith("/api") ||
      c.req.path.startsWith("/status") ||
      c.req.path.startsWith("/health") ||
      c.req.path.startsWith("/s/") ||
      c.req.path.startsWith("/badge")
    ) {
      return next();
    }

    if (!isValidCustomDomainFormat(host)) {
      return next();
    }

    let slug: string | null;
    const cached = cacheGet(host);
    if (cached) {
      slug = cached.slug;
    } else {
      const [page] = await db
        .select({ slug: statusPages.slug })
        .from(statusPages)
        .where(eq(statusPages.customDomain, host))
        .limit(1);
      slug = page?.slug ?? null;
      cacheSet(host, slug);
    }

    if (!slug) return next();

    const url = new URL(c.req.url);
    url.pathname = `/status/${slug}${url.pathname === "/" ? "" : url.pathname}`;
    const newReq = new Request(url.toString(), c.req.raw);
    return appRef.fetch(newReq);
  };
}
