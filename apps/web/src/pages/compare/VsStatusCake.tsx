import { CompareLayout } from "./CompareLayout";

export function VsStatusCake() {
  return (
    <CompareLayout
      competitor="StatusCake"
      competitorShort="StatusCake"
      headline={<>StatusCake without the<br /><span className="highlight">enterprise pricing.</span></>}
      subhead="StatusCake works, but the pricing tiers jump quickly and the dashboard feels heavy. UptimeCrow is a modern, developer-first alternative — flat pricing, MIT open-source, MCP-native, free for 25 monitors."
      pitch={
        <>
          <p>
            StatusCake has been around forever and the core monitoring is reliable. But the product feels
            built for IT teams in 2015, not solo developers in 2026. Pricing tiers gate features
            arbitrarily, the dashboard is dense, and any modern integration (Slack-level, Telegram,
            MCP) feels bolted on.
          </p>
          <p style={{ marginTop: "1rem" }}>
            UptimeCrow is what an uptime monitor looks like when you start from a developer's workflow:
            <strong> 60-second checks on the free tier, every notification channel on every plan, MIT
            open-source so you can self-host, and a native MCP server</strong> for AI assistants. No
            "contact sales" tier.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Pre-rendered status pages and built-in on-call rotation make UptimeCrow a single tool where
            StatusCake users typically end up buying StatusCake + Statuspage.io + PagerDuty.
          </p>
        </>
      }
      whyUs={[
        {
          title: "All channels on every plan",
          body: "StatusCake gates Slack, Teams, and SMS behind higher tiers. UptimeCrow includes Slack, Discord, PagerDuty, Microsoft Teams, Telegram, custom webhooks, and email on every plan — even free.",
        },
        {
          title: "Open source, self-hostable",
          body: "MIT-licensed on GitHub. Run UptimeCrow in your own Docker stack with zero vendor lock-in. StatusCake is closed source.",
        },
        {
          title: "Pre-rendered status pages",
          body: "Your status page is pre-rendered HTML and stays online even when your origin is down. StatusCake's status pages are live-rendered and a separate paid feature.",
        },
        {
          title: "MCP server for AI assistants",
          body: "The only monitoring tool with a native MCP server. Query monitor status, list incidents, and create monitors from Claude, Cursor, or any MCP-aware AI client.",
        },
      ]}
      rows={[
        { feature: "Free tier", us: "✓ 25 monitors, 1-min checks", them: "✓ 10 tests, 5-min checks" },
        { feature: "Indie/Solo plan", us: "$12/mo · 25 monitors + API + custom domain", them: "$24.49/mo · Superior plan" },
        { feature: "Pro plan", us: "$29/mo · 50 monitors · 30s checks", them: "$66.66/mo · Business plan" },
        { feature: "Heartbeat / cron monitoring", us: "✓ All plans incl. free", them: "✓ Paid plans" },
        { feature: "SSL & domain expiry alerts", us: "✓ All plans incl. free", them: "✓ All plans" },
        { feature: "Public status page", us: "✓ Pre-rendered, all plans", them: "Paid plans" },
        { feature: "Pre-rendered status page", us: "✓ Survives origin downtime", them: "✗ Live-rendered" },
        { feature: "Auto-created incidents", us: "✓ Zero clicks", them: "✓ Available" },
        { feature: "Maintenance windows", us: "✓ All plans", them: "✓ All plans" },
        { feature: "Custom domain status page", us: "Indie plan ($12/mo)", them: "Business plan" },
        { feature: "Slack / Discord webhooks", us: "✓ All plans incl. free", them: "Paid plans" },
        { feature: "PagerDuty / Teams / Telegram", us: "✓ Built-in, all plans", them: "Paid plans" },
        { feature: "SMS alerts", us: "✓ Twilio integration", them: "Pay-per-SMS extra" },
        { feature: "On-call rotation built-in", us: "✓ Email + SMS", them: "✗ Use PagerDuty" },
        { feature: "MCP server (AI assistants)", us: "✓ Native", them: "✗ Not available" },
        { feature: "Self-host option", us: "✓ MIT-licensed", them: "✗ Closed source" },
        { feature: "API access", us: "Indie plan ($12/mo)", them: "Paid plans" },
        { feature: "Multi-region checks", us: "Team plan ($79/mo)", them: "✓ All plans" },
      ]}
      whenThem={
        <>
          <p>
            StatusCake remains a fit if you specifically need their geographic test-location coverage on
            the free tier, or if your team is already invested in their ecosystem.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            For everyone else — solo developers, indie hackers, small SaaS teams who want a modern
            dashboard, every alert channel without paying up, an MCP integration for AI workflows, and
            the option to self-host — UptimeCrow is a cleaner fit at lower cost.
          </p>
        </>
      }
    />
  );
}
