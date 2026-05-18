# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-05-12

## User Preferences

- User asks for comprehensive audits before committing — "uygula ama commit etme" means apply but don't commit yet

## Key Learnings

- **Project:** uptimecrow
- **Description:** Developer-first uptime monitoring and status page platform. Monitor your services, notify subscribers on incidents, and serve pre-rendered status pages that stay online even when your origin goes down
- **Compare page routes:** `/vs/betterstack` and `/vs/uptimerobot` (NOT `/compare/...`) — defined in App.tsx
- **Dev server:** Docker is not available in this environment; use `pnpm dev:web` which starts on port 5174 (5173 is taken by HookSense, another project)
- **Shared package:** Must build `@uptimecrow/shared` with `pnpm --filter @uptimecrow/shared build` before running `pnpm dev:web`, otherwise Vite fails to resolve the package
- **Billing:** Self-serve billing is paused; upgrade requests go to support@uptimecrow.com (email manually). Polar is the billing provider when re-enabled
- **Brand:** All public-facing support email must be `support@uptimecrow.com` — old references to `support@hooksense.com` were scattered across Pricing.tsx, Settings.tsx, Legal.tsx, CompareLayout.tsx

## Key Learnings

- **Overview gating bug:** Original code showed Onboarding when `!totalStatusPages`, meaning users with monitors but no status page lost all their monitor data. Fixed to gate on `!hasMonitors` instead.
- **Feature discovery pattern:** Users don't know what Heartbeats/Maintenance do. Show description subtitles in sidebar + FeatureDiscoveryCard in Overview when user is "settled in" (has monitors + status pages).
- **Heartbeat status field:** `HeartbeatStatus = "healthy" | "late" | "paused" | "unknown"`, `isActive: boolean` on the Heartbeat type.
- **useHeartbeats query** is available in `apps/web/src/lib/queries/heartbeats.ts` and can be used in Overview without performance issues (parallel query).

## Key Learnings

- **Dashboard product preview on landing page:** Added `DashboardPreview` and `StatusPagePreview` React components as inline HTML mockups to Landing.tsx. These use dedicated CSS classes (mock-browser, mock-chrome, mock-app, mock-sidebar, mock-stat-card, etc.) added to Landing.css. They appear in two new `preview-section` sections between "How it works" and "Features".
- **Status page HTML redesign:** The `renderStatusHtml` function in `static-gen.service.ts` uses a fully custom HTML/CSS template. Key new features: accent-bar at top, status-hero with icon+label+countdown, ubar-track for uptime bars (30px height flex divs), incident-card with left border, subscribe-section with icon+form, JS theme toggle (dark/light with icons), per-second countdown refresh timer.
- **Dashboard MetricCards:** Replaced flat `StatRow` text row with a 2×4 responsive grid of `MetricCards`. Each card has: small icon top-left, big bold number, label, optional colored badge. Uses `bg-card border-border` Tailwind pattern.
- **Dashboard Onboarding redesign:** Now has: gradient welcome hero card with progress bar (width driven by % of required steps done), step cards with step-number circle icon and detailed description (explaining WHY), dots progress indicator per step, "What you'll get" section at bottom showing 3 final outcome features.

## Key Learnings

- **MCP server route:** `/api/mcp` (POST = JSON-RPC, GET = discovery info). Authenticated via API key Bearer token. Tools: get_status_summary, list_monitors, list_active_incidents, get_monitor_detail, list_heartbeats.
- **New notification integrations:** PagerDuty (Events API v2 via `pagerdutyIntegrationKey`), Teams (MessageCard webhook), Telegram (Bot API). All stored on `organizations` table, fire in `notify.job.ts`.
- **DB migration pattern:** Direct `docker compose exec -T postgres psql` for dev migrations; SQL file placed in `apps/api/drizzle/` for reproducibility. Migration applied: `0012_new_integrations.sql`.
- **Incident templates:** Client-side only (no DB). 9 templates in `IncidentCreate.tsx` using `INCIDENT_TEMPLATES` const, applied via `setValue` in react-hook-form.
- **Telegram bot token masking:** Settings GET endpoint masks token as `••••<last4>`. Settings.tsx detects `••` prefix and skips re-sending the token on PATCH.
- **Landing page free tier:** Hero badge explicitly states "Free forever · 10 monitors · 1 status page · 60-second checks". Logo wall uses tag-style chips for product categories instead of customer logos (no real customers yet).
- **Comparison table:** Now has 11 rows including MCP server, PagerDuty+Teams+Telegram, incident templates, false positive prevention.

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

[2026-05-12] Used `/compare/betterstack` as link target — correct routes are `/vs/betterstack` and `/vs/uptimerobot` per App.tsx router definition.

[2026-05-12] Tried `openwolf designqc` without `--url` when port 5173 was running a different project (HookSense). Always check which app is at which port; UptimeCrow dev runs on 5174 here.

## Key Learnings

- **SEO/GEO hook:** `usePageMeta()` in `apps/web/src/lib/meta.ts` — updates document.title, all meta/og/twitter tags, canonical link, and optionally injects page-specific JSON-LD `<script id="__page_ld__">` on mount; cleans up on unmount. Empty deps `[]` is correct since each route unmounts/remounts on navigation.
- **GEO strategy:** FAQ JSON-LD on Landing.tsx (8 Q&A covering "What is UptimeCrow?", "Is it free?", heartbeat, MCP, self-host, etc.) is the primary GEO signal for AI search engines (Perplexity, Google AI Overview, ChatGPT).
- **CompareLayout SEO:** Per-competitor title/desc derived from `competitor` prop. Canonical URL uses `window.location.pathname`. BreadcrumbList JSON-LD included. No need to touch individual Vs*.tsx files.

## Key Learnings

- **Free tier is now 25 monitors** (not 3 as old docs claimed). Indie is 30, Pro is 50, Team is 200. Plan ladder: free=25/indie=30/pro=50/team=200.
- **CSS vars --accent and --danger are NOT defined in globals.css** — they must be added to Landing.css `:root` and `.light .landing` blocks as `--accent: var(--green); --danger: var(--red)`. Without this, all tools pages, Changelog, McpPage, HeartbeatPage have broken color references.
- **og-image.png never existed** — og:image references point at /og-image.svg (created in this session). Do not reference /og-image.png.
- **notification.service.ts email XSS fixed** — all user-controlled values now wrapped in escapeHtml(). This was a P0 security issue: incident titles, update bodies, status page names, monitor URLs were all interpolated raw into HTML email templates.
- **Static page store is in-process Map** — not Redis. This means /health/ready can pass but static pages go stale in multi-container deploys (MODE=api + MODE=worker separate containers). Long-term: move to Redis key storage. Tracked in ASSESSMENT_2026Q2_TECH.md.
- **SIGTERM handlers added** — index.ts and worker.ts now have SIGTERM/SIGINT handlers. startWorker() returns all 5 worker handles. startServer() returns server handle.
- **CompareLayout footer** needed manual update — when new Vs pages are added, update both App.tsx routes AND CompareLayout.tsx footer-links block.
- **RSS feed endpoint** already existed (as RSS 2.0) at `/status/:slug/rss` — was rewritten to Atom 1.0 in this session.
- **Pricing.tsx inline style CSS var concat** was invalid: `"var(--green)18"` — correct pattern: use `"var(--green-dim)"` or `rgba(0, 230, 118, 0.25)` for dimmed color variants.
- **BetterStack pricing in 2026**: $34/mo (raised from $29). Correct this in any compare copy.
- **OneUptime** is a new serious OSS competitor (Apache 2.0, Growth $22/mo, full observability). Add /vs/oneuptime done.

## Decision Log

[2026-05-12] Added social proof strip between terminal demo and "How it works" section using flex layout with nowrap + dividers. Used honest feature claims (30s checks, auto incidents, free forever) rather than fake user counts.

[2026-05-12] Redesigned footer from minimal single-row to structured 3-column layout (Product, Compare, Legal) matching modern SaaS landing page conventions.

[2026-05-19] Indie tier 25→30 monitors: free and indie were both at 25 creating zero upgrade signal. 30 creates visible differentiation without undercutting pro (50). This was a deliberate plan-design fix, not a marketing claim.

[2026-05-19] Chose to NOT move static page store to Redis in this session — it's a P2 architectural item, risk-free in single-container deploy (default). Documented in assessment; tackle when multi-container scaling is planned.
