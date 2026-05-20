import { CompareLayout } from "./CompareLayout";

export function VsUptimeRobot() {
  return (
    <CompareLayout
      competitor="UptimeRobot"
      competitorShort="UptimeRobot"
      headline={<>Modern UX.<br /><span className="highlight">Same price band.</span></>}
      subhead="UptimeRobot pioneered cheap uptime monitoring. UptimeCrow gives you the same price band with 1-minute checks, heartbeat monitoring, automatic incident management, and a status page that actually looks like 2026."
      pitch={
        <>
          <p>
            UptimeRobot is a known brand with a huge install base. Their Free tier is genuinely generous
            (50 monitors, 5-minute interval), and if you just need a "did my site go down last night?"
            checker, they're hard to beat on raw monitor count.
          </p>
          <p style={{ marginTop: "1rem" }}>
            The trade-offs are UX and feature depth: the dashboard is dated, there's no automatic incident
            management, no heartbeat monitoring for cron jobs, and the status page templates feel early-2010s.
            UptimeCrow sits in the same price band but ships a modern dashboard, pre-rendered status pages,
            heartbeat monitoring on every plan, and fully automatic incident management.
          </p>
        </>
      }
      whyUs={[
        {
          title: "Automatic incident management",
          body: "When a monitor goes down, we open an incident, write the first status update, and update your public status page — zero clicks from you. UptimeRobot notifies you; you still manage the incident manually.",
        },
        {
          title: "Heartbeat monitoring (UptimeRobot has none)",
          body: "Monitor cron jobs, backups, and scheduled tasks with unique ping URLs. If your scheduled job stops phoning home, you know immediately. Not available on UptimeRobot at any tier.",
        },
        {
          title: "Modern, branded status pages",
          body: "Custom domain, brand color, logo, embeddable uptime badge, and a pre-rendered status page that survives origin downtime.",
        },
        {
          title: "MCP server — query your monitors from any AI assistant",
          body: "UptimeCrow is the only uptime monitor with a native MCP server. Ask Claude or Cursor 'which of my monitors is down?' without opening a dashboard.",
        },
        {
          title: "1-minute checks, free. 30-second on Pro+",
          body: "UptimeRobot's free tier is 5-minute intervals. UptimeCrow gives you 1-minute checks free and 30-second checks on Pro and Team plans.",
        },
      ]}
      rows={[
        { feature: "Free tier", us: "25 monitors, 1-min checks", them: "50 monitors, 5-min checks" },
        { feature: "Heartbeat monitoring", us: "✓ All plans incl. free", them: "✗ Not available" },
        { feature: "Pro plan", us: "$29/mo · 50 monitors", them: "$7/mo · 10 monitors" },
        { feature: "Team plan", us: "$79/mo · 200 monitors", them: "$15/mo · 50 monitors" },
        { feature: "Min check interval", us: "30s Pro/Team · 1 min Free/Indie", them: "5 min free / 1 min paid" },
        { feature: "Auto-created incidents", us: "✓ Zero clicks", them: "✗ Manual" },
        { feature: "Status page quality", us: "✓ Modern, pre-rendered", them: "Basic, limited branding" },
        { feature: "Pre-rendered status page", us: "✓ Stays up during outage", them: "Live-rendered" },
        { feature: "Scheduled maintenance windows", us: true, them: true },
        { feature: "Email subscribers", us: true, them: true },
        { feature: "Slack / Discord webhooks", us: "✓ All plans incl. free", them: "Paid plans" },
        { feature: "Multi-region checks", us: "Team plan", them: "Higher tiers" },
        { feature: "Keyword monitoring", us: true, them: true },
        { feature: "SMS alerts (Twilio)", us: "✓ Paid plans", them: "✓ Paid plans" },
        { feature: "MCP server (AI assistants)", us: "✓ Native", them: "✗ Not available" },
        { feature: "Self-host option", us: "✓ AGPL-3.0", them: false },
        { feature: "API access", us: "Pro plan", them: "Paid plans" },
      ]}
      whenThem={
        <>
          <p>
            UptimeRobot is the better call if your monitor count is the dominant cost driver — their Free
            tier alone handles 50 monitors, which no other hosted provider matches at $0.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            If you mostly care about "did the URL return 200?" and you don't need a customer-facing status
            page or automatic incident management, UptimeRobot's pricing is genuinely hard to argue with.
            We're a better fit once you want a status page your customers actually see.
          </p>
        </>
      }
    />
  );
}
