# Show HN draft

**Title:**
Show HN: UptimeCrow – Open-source uptime monitoring with real status pages and teams

(Alt titles to A/B in your head — HN dislikes hype:)
- Show HN: UptimeCrow – Self-hostable uptime monitor that your AI agent can query (MCP)
- Show HN: UptimeCrow – Uptime Kuma but with multi-tenant status pages and a hosted option

**URL:** https://github.com/ozers/uptimecrow

---

**Body:**

Hi HN — I'm a solo dev and I've been building UptimeCrow for a few months. It's
an uptime monitor + status page platform, AGPL-3.0, self-hostable with one
`docker compose up`.

I built it because the self-host options I tried were great at the "is my host
up?" loop but thin on the things a small team actually needs once more than one
person cares: multi-user orgs, status pages you can put on a custom domain and
let customers subscribe to, automatic incident open/resolve, and maintenance
windows. Uptime Kuma is excellent and I'm not trying to replace it for homelab
single-user setups — UptimeCrow is more "what you move to when you outgrow that."

What's in the open-source core (no feature gates, self-host unlimited):
- HTTP / TCP / keyword checks with a Redis-backed consecutive-failure state
  machine (so one blip doesn't page you)
- Pre-rendered status pages — they're static HTML, so they stay up even when your
  origin/DB is down
- Automatic incidents (open on down, resolve on recovery), maintenance windows
- Heartbeat / cron monitoring (dead-man's-switch)
- Email (SES), Slack, Discord, PagerDuty, Teams, Telegram, generic webhooks
- Full REST API + a native MCP server, so you can ask Claude/Cursor "which
  monitors are down?" without opening a dashboard
- Multi-tenant orgs with roles

Stack: Hono + TypeScript + Drizzle + Postgres + BullMQ/Redis on the backend,
Vite/React on the front. There's a managed cloud if you'd rather not run it, but
the whole thing genuinely runs on your own box.

Honest caveats since you'll read the code anyway: it's solo-maintained, the
"multi-region" idea isn't shipped (so it's not advertised), and the status-page
render store is in-memory today (fine for a single instance; an external store
is on the roadmap for horizontal scaling).

I'd love feedback on the architecture and on whether the status-page-first +
self-host-or-hosted angle resonates, or if I'm wrong about the gap. Repo's AGPL;
happy to answer anything.
