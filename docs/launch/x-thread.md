# X / Twitter thread draft

Attach the 30–60s demo GIF to tweet 1. Keep it calm; let the product carry it.

---

**1/**
I open-sourced UptimeCrow 🐦

Uptime monitoring + status pages you can self-host (AGPL, one `docker compose up`) — or let us host it.

Unlimited monitors when you self-host. Free.

🔗 github.com/ozers/uptimecrow
[demo GIF]

**2/**
Why another monitor? Most self-host options nail "is my site up?" but get thin
once a *team* cares:

– multi-user orgs
– status pages on your domain, with subscribers
– auto incidents + maintenance windows

That's the gap UptimeCrow fills.

**3/**
The status pages are pre-rendered static HTML — so your status page stays up
*even when your origin and DB are down*. The one moment your users actually
check it is the one moment most status pages also go down. Not this one.

**4/**
It also ships a native MCP server.

You can ask Claude or Cursor "which of my monitors are down right now?" and it
answers from live data — without leaving your editor. First uptime tool to do
this as far as I know.

**5/**
Open core, honestly drawn:
– Self-host (AGPL): unlimited, free forever
– Managed cloud: free tier to try, paid for faster checks / more monitors / teams

No fake "multi-region" claims, no inflated limits. Read the code — it's all there.

**6/**
Built solo with Hono + TS + Drizzle + Postgres + BullMQ + React.

If you've outgrown a single-user monitor, or you just want a status page that
survives your own outage, I'd love your feedback.

⭐ github.com/ozers/uptimecrow
