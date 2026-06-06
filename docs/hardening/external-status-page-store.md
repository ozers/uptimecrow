# OZE-91 — External status-page store (design)

**Status:** plan only (not yet needed). The current in-memory store is correct
for a single API instance, which is the only supported topology today. Implement
this when scaling to 2+ API replicas — shipping the async refactor blind to a
core serving path (`/s/:slug`) without runtime verification isn't worth it yet.

## The problem

`apps/api/src/services/static-gen.service.ts` keeps rendered pages in a
process-local `Map` (`pageStore`). Consequences:

- A process restart drops all rendered pages until each regenerates.
- With multiple API replicas, a `regenerate` job updates only the replica that
  ran it; other replicas serve stale/missing pages for `/s/:slug`.

So horizontal scaling of the API is blocked until the store is external.

## Recommended approach: Redis-backed (Redis is already a dependency)

Lowest-friction — no new infra (S3/R2 would also work and is better for CDN
fronting, but adds a dependency). Keep the in-memory map as an L1 cache.

### Interface change (the only hard part: sync → async)

`getRenderedPage(slug)` is currently synchronous and called synchronously in
`server.ts` at `/s/:slug`. Redis is async, so:

1. `setRenderedPage(slug, {html, json})` → also `redis.set("page:"+slug, JSON, "EX", <ttl>)`.
2. `getRenderedPage(slug)` → becomes `async`: check L1 map; on miss, `redis.get`,
   re-hydrate L1, return; on miss, return null (caller already handles null).
3. `server.ts` `/s/:slug` handler: `const rendered = await getRenderedPage(slug);`
   (the handler is already `async`-capable in Hono).
4. `generate.job.ts`: no change beyond the write going through `setRenderedPage`.

Gate behind `PAGE_STORE=redis` (default `memory`) so single-instance self-hosters
are unaffected and the change is opt-in until verified.

### Verification (must do live, hence not shipped blind)

- Single instance: `/s/:slug` still serves after a restart (Redis-backed).
- Two instances behind a proxy: regenerate on A → B serves the fresh page.
- TTL/eviction behaves (stale page refreshes on next regenerate).

## Bonus (separate, later)

Front `/s/:slug` and `/status/:slug` with a CDN for origin-downtime resilience —
the whole point of pre-rendering. An S3/R2 backend makes this trivial (serve
static objects directly from the bucket/CDN, API only writes).

## Acceptance

- [ ] `PAGE_STORE=redis` serves consistent pages across 2+ replicas
- [ ] Default (`memory`) unchanged for single-instance self-host
- [ ] Survives API restart when Redis-backed
