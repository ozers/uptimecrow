import { CompareLayout } from "./CompareLayout";

export function VsOneUptime() {
  return (
    <CompareLayout
      competitor="OneUptime"
      competitorShort="OneUptime"
      headline={<>Focused monitoring.<br /><span className="highlight">Not a second Datadog.</span></>}
      subhead="OneUptime is a full observability platform chasing logs, traces, and metrics. UptimeCrow is laser-focused on uptime monitoring, heartbeats, and status pages — simpler, faster to set up, and MIT-licensed."
      pitch={
        <>
          <p>
            OneUptime is an ambitious open-source project that wants to be a self-hosted Datadog — uptime
            monitoring, structured logs, distributed traces, metrics, on-call, and status pages all in one
            Apache 2.0-licensed stack. If you're replacing a full observability platform, it's worth a look.
          </p>
          <p style={{ marginTop: "1rem" }}>
            But there's a real cost to "do everything" products: complexity. OneUptime's stack is
            substantially larger (MongoDB + Express vs our Postgres + Hono + BullMQ), configuration is
            heavier, and the product surface area means a longer time-to-first-alert. If your actual need
            is "ping my URLs, catch when my cron jobs die, and show customers a live status page" —
            UptimeCrow is running in under a minute.
          </p>
          <p style={{ marginTop: "1rem" }}>
            UptimeCrow is also <strong>MIT-licensed</strong>, which is more permissive than Apache 2.0 for
            proprietary forks and commercial deployments. And it's the <strong>only monitoring tool with a
            native MCP server</strong> — so your AI assistant can answer "is production down?" without
            you leaving your editor.
          </p>
        </>
      }
      whyUs={[
        {
          title: "Up in one command",
          body: "docker compose up gives you API + worker + Postgres + Redis + web in under a minute. OneUptime's self-hosted stack requires significantly more configuration with more moving parts.",
        },
        {
          title: "More permissive license (MIT vs Apache 2.0)",
          body: "MIT imposes fewer restrictions than Apache 2.0 for commercial use, proprietary modifications, and embedding in closed-source products. No patent clauses to worry about.",
        },
        {
          title: "Modern TypeScript stack",
          body: "Hono + Drizzle ORM + BullMQ on Postgres — all TypeScript end to end. OneUptime uses a Node/Express/MongoDB stack. If your team lives in TypeScript, contributing or forking UptimeCrow is much lower friction.",
        },
        {
          title: "Native MCP server for AI assistants",
          body: "The only monitoring tool with a built-in Model Context Protocol server. Ask Claude Code, Cursor, or Windsurf which monitors are down, acknowledge incidents, or check uptime percentages — directly in your editor.",
        },
        {
          title: "Genuinely free cloud tier",
          body: "UptimeCrow's managed cloud offers 50 monitors, 1 status page, heartbeats, and alerts at $0 — permanently. OneUptime's cloud free tier is more limited, and their Growth plan starts at $22/mo.",
        },
        {
          title: "Pre-rendered status pages",
          body: "UptimeCrow status pages are generated as static HTML — no database query on render. They survive origin outages because they don't talk to the database to load. If your own infrastructure is down, your status page still shows the right state.",
        },
      ]}
      rows={[
        { feature: "Starting price (cloud)", us: "$0 free forever · 50 monitors", them: "Free (limited) · Growth $22/mo" },
        { feature: "Pro / Scale plan", us: "$29/mo · 50 monitors", them: "$99/mo · Scale" },
        { feature: "Team plan", us: "$79/mo · 200 monitors · 10 seats", them: "Enterprise (custom)" },
        { feature: "License", us: "✓ MIT", them: "Apache 2.0" },
        { feature: "HTTP / TCP uptime monitoring", us: "✓ All plans incl. free", them: "✓ All plans" },
        { feature: "Heartbeat / cron monitoring", us: "✓ All plans incl. free", them: "✓ Available" },
        { feature: "Keyword / content checks", us: "✓ All plans", them: "✓ Available" },
        { feature: "Slow response threshold", us: "✓ All plans", them: "✓ Available" },
        { feature: "Auto-created incidents", us: "✓ Zero clicks", them: "✓ Available" },
        { feature: "Public status page", us: "✓ Pre-rendered, all plans", them: "✓ Available" },
        { feature: "Custom domain status page", us: "Indie plan ($12/mo)", them: "Paid plans" },
        { feature: "Pre-rendered status page", us: "✓ Survives origin downtime", them: "✗ Live-rendered" },
        { feature: "On-call scheduling", us: "✓ Paid plans", them: "✓ Available" },
        { feature: "Logs / traces / metrics", us: "✗ Focused on uptime", them: "✓ Full observability" },
        { feature: "OpenTelemetry native", us: "✗", them: "✓ Native OTel" },
        { feature: "MCP server (AI assistants)", us: "✓ Native — unique feature", them: "✗ Not available" },
        { feature: "Self-host (Docker Compose)", us: "✓ Single compose, one command", them: "✓ Available but heavier" },
        { feature: "Multi-region checks", us: "Team plan ($79/mo)", them: "Available" },
        { feature: "API access", us: "Indie plan ($12/mo)", them: "Paid plans" },
        { feature: "Slack / Discord / PagerDuty", us: "✓ All plans incl. free", them: "✓ More integrations" },
        { feature: "Tools suite (SSL, DNS, uptime)", us: "✓ Public, no login", them: "✗ Not available" },
        { feature: "Tech stack", us: "Hono + Postgres + BullMQ (TypeScript)", them: "Express + MongoDB (Node)" },
      ]}
      whenThem={
        <>
          <p>
            OneUptime is the right call if you need a <strong>full observability stack</strong> — structured
            log aggregation, distributed tracing, and metrics — under a single self-hosted tool alongside
            your uptime monitoring. If your team is migrating from Datadog or New Relic and wants to own
            the entire stack, OneUptime's scope is a much closer match.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            Their notification integration list is also broader, and their status page customization
            options are more extensive. For large-scale production deployments with complex on-call trees,
            they have a more mature feature set in those areas.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            If your requirement is clean uptime monitoring, heartbeats, and a status page that stays
            online when you're down — UptimeCrow gets you there faster, with less operational overhead,
            and at a lower price.
          </p>
        </>
      }
    />
  );
}
