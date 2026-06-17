import { CompareLayout } from "./CompareLayout";

export function VsBetterStack() {
  return (
    <CompareLayout
      competitor="BetterStack"
      competitorShort="BetterStack"
      headline={<>Fair pricing.<br /><span className="highlight">The same core monitoring.</span></>}
      subhead="UptimeCrow covers the same uptime and status-page ground as BetterStack Uptime, at a fraction of the price — with heartbeat monitoring included on every plan, and an open-source core you can self-host."
      pitch={
        <>
          <p>
            BetterStack is a polished, well-marketed product bundling uptime monitoring, logs, and incident management.
            If you need log aggregation, on-call rotations, and deep third-party integrations all under one roof,
            their pricing probably makes sense.
          </p>
          <p style={{ marginTop: "1rem" }}>
            If all you actually need is <strong>checks, heartbeats, incidents, and a branded status page</strong>, UptimeCrow
            does that for $10/mo instead of $29–$200/mo. The status page is pre-rendered so it stays online
            when your origin is down. And heartbeat monitors keep an eye on your cron jobs — included on every plan, even the free tier.
          </p>
          <p style={{ marginTop: "1rem" }}>
            UptimeCrow is also the <strong>only uptime monitor with a native MCP server</strong> — query your monitor
            status, acknowledge incidents, and manage on-call directly from Claude, Cursor, or any AI assistant.
            And if you'd rather not depend on another hosted service, the entire stack is{" "}
            <strong>AGPL-3.0 licensed and self-hostable</strong> with a single Docker Compose command.
          </p>
        </>
      }
      whyUs={[
        {
          title: "Status page that survives outages",
          body: "Your status page is pre-rendered HTML. If your API is down — or your status page renderer is down — users still see the latest state.",
        },
        {
          title: "Heartbeat monitoring on every plan",
          body: "Monitor cron jobs, backups, and scheduled tasks. BetterStack restricts heartbeats to paid plans. We include 5 heartbeats on the free tier.",
        },
        {
          title: "Transparent, flat pricing",
          body: "$0 free, $10/mo Indie, $30/mo Pro, $80/mo Team. No seat-based pricing, no usage surprises.",
        },
        {
          title: "Open source core, AGPL-3.0",
          body: "Self-host the entire stack with Docker Compose. No vendor lock-in, no data residency headaches.",
        },
      ]}
      rows={[
        { feature: "Starting price", us: "$0 free forever", them: "Free trial, then from $29/mo" },
        { feature: "Pro plan", us: "$30/mo · 100 monitors", them: "$29/mo · 10 monitors" },
        { feature: "Minimum check interval", us: "30s Pro/Team · 1 min Free/Indie", them: "30 seconds (paid plans)" },
        { feature: "Heartbeat monitoring", us: "✓ All plans incl. free", them: "Paid plans only" },
        { feature: "Auto-created incidents", us: true, them: true },
        { feature: "Custom domain status page", us: "Indie plan ($10/mo)", them: "Paid plans" },
        { feature: "Pre-rendered status page", us: "✓ Survives origin downtime", them: "Live-rendered", note: "Matters when your own outage takes down your status page." },
        { feature: "Scheduled maintenance windows", us: true, them: true },
        { feature: "Subscriber email notifications", us: true, them: true },
        { feature: "Slack / Discord webhooks", us: "✓ Indie & up", them: "Paid plans" },
        { feature: "SMS alerts (Twilio)", us: "✓ All paid plans", them: "✓ Built-in" },
        { feature: "MCP server (AI assistants)", us: "✓ Native — only uptime tool with this", them: "✗ Not available" },
        { feature: "Self-host option", us: "✓ AGPL-3.0", them: false },
        { feature: "API access", us: "Pro plan", them: "Paid plans" },
        { feature: "On-call rotations", us: "Not yet", them: true },
        { feature: "Log aggregation", us: false, them: true },
        { feature: "Synthetic browser monitoring", us: "Roadmap", them: true },
      ]}
      whenThem={
        <>
          <p>
            BetterStack is the better call if you need log aggregation next to your uptime data, PagerDuty-style
            on-call rotations with escalations, or dozens of pre-built integrations (PagerDuty, OpsGenie,
            VictorOps, Zendesk, and so on).
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            Their platform is more mature; their price reflects that. We're a better fit for teams who want
            monitoring and status pages without the overhead of a full incident-management suite.
          </p>
        </>
      }
    />
  );
}
