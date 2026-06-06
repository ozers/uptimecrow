# Launch kit

Ready-to-use launch copy for UptimeCrow's open-source launch. Drafts only —
nobody posts these for you; review, tweak voice, and post when M1/M2 are merged
and the repo is public.

## Positioning (the one sentence)

> Open-source uptime monitoring with **real** status pages, teams, and a managed
> option — self-host unlimited for free, or let us host it.

We are **not** "another Uptime Kuma." We pick up where Kuma stops: multi-tenant
orgs, status pages as a product (custom domain, subscribers, pre-rendered so they
survive your origin going down), a REST API, and a native MCP server. Kuma is
brilliant at single-user self-host; UptimeCrow is what you reach for when you
outgrow that.

## The honest "free" story

- **Self-host (AGPL-3.0): unlimited, free forever.** This is our generous free tier.
- **Managed cloud free tier: 10 monitors, 5-min checks, 7-day history.** A no-friction
  way to try the hosted product. Paid plans add faster checks, more monitors, longer
  history, integrations, and teams.

Do **not** claim things we don't ship (no "multi-region", no inflated free limits).
The whole point of this launch is credibility.

## Pre-launch checklist

- [ ] M1 + M2 PRs merged to `main` (security fixes are a hard precondition — the
      code is public the moment we launch)
- [ ] README plan table matches `packages/shared/src/constants.ts`
- [ ] `docker compose -f docker-compose.prod.yml up -d` verified on a clean machine
- [ ] A 30–60s demo GIF recorded (dashboard → add monitor → status page)
- [ ] PostHog `VITE_POSTHOG_KEY` set so launch-day traffic is measured
- [ ] Repo description + topics set (uptime-monitoring, status-page, self-hosted, monitoring)
- [ ] Pin a "Launch day" GitHub Discussion to catch feedback

## Sequence (one good wave, not spray-and-pray)

1. **r/selfhosted** — primary audience. Post `reddit-selfhosted.md` first; it's where
   Uptime Kuma's users live.
2. **Show HN** — same day or next morning (US time). Use `show-hn.md`.
3. **X/Twitter** — `x-thread.md` + the demo GIF, link the HN thread.
4. Secondary, if there's traction: r/webdev, r/devops, lobste.rs.

Then watch PostHog for 2 weeks. Signal (stars, signups, a paying customer) → double
down. Zero signal → that's real data; reassess rather than grind.
