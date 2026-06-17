import { CompareLayout } from "./CompareLayout";

export function VsPingdom() {
  return (
    <CompareLayout
      competitor="Pingdom"
      competitorShort="Pingdom"
      headline={<>All the monitoring.<br /><span className="highlight">A fraction of the price.</span></>}
      subhead="Pingdom charges $15–$250/mo for features UptimeCrow ships on a $0–$79 scale. You get uptime checks, heartbeat monitoring, branded status pages, and automatic incident management — without the Pingdom sticker shock."
      pitch={
        <>
          <p>
            Pingdom (now part of SolarWinds) is one of the oldest names in uptime monitoring — battle-tested,
            widely recognized, and priced accordingly. Their entry plan starts at $15/mo for 10 checks with a
            1-minute interval, and prices scale sharply from there.
          </p>
          <p style={{ marginTop: "1rem" }}>
            UptimeCrow covers the same core use case — <strong>HTTP, TCP, keyword checks with alerting and a
            public status page</strong> — starting at $0. The hosted free tier gives you 10 monitors with no
            credit card required — and the open-source core lets you self-host unlimited monitors for free. Heartbeat monitoring for cron jobs and scheduled tasks is
            included on every plan, which Pingdom doesn't offer at all.
          </p>
          <p style={{ marginTop: "1rem" }}>
            UptimeCrow is also the <strong>only uptime monitor with a native MCP server</strong>, letting you
            query monitor status and manage incidents from Claude, Cursor, or any AI assistant. And if you
            want full control, the entire stack is <strong>AGPL-3.0 licensed and self-hostable</strong>.
          </p>
        </>
      }
      whyUs={[
        {
          title: "Up to 90% cheaper for the same core feature set",
          body: "Pingdom's cheapest plan is $15/mo for 10 monitors. UptimeCrow's free tier gives you 10 monitors at no cost, and the Indie plan ($9/mo) adds a custom domain and API access.",
        },
        {
          title: "Heartbeat / cron job monitoring included",
          body: "Pingdom has no heartbeat monitoring. UptimeCrow includes 5 heartbeat monitors on the free tier and scales up from there — monitor any scheduled task that should phone home.",
        },
        {
          title: "Automatic incident management",
          body: "When a monitor trips, UptimeCrow opens an incident, posts the first update, and regenerates your status page automatically. No manual triage needed.",
        },
        {
          title: "Open-source, self-hostable, no vendor lock-in",
          body: "AGPL-3.0 licensed on GitHub. Run the full stack yourself with Docker Compose, or use our managed cloud. Either way you own your data.",
        },
      ]}
      rows={[
        { feature: "Starting price", us: "$0 free forever", them: "$15/mo (10 checks)" },
        { feature: "Pro-tier price", us: "$29/mo · 100 monitors", them: "$40–$100/mo" },
        { feature: "Free tier", us: "✓ 10 monitors · unlimited self-host", them: "✗ No free tier" },
        { feature: "Heartbeat / cron monitoring", us: "✓ All plans incl. free", them: "✗ Not available" },
        { feature: "Min check interval", us: "30s Pro/Team · 1 min Free/Indie", them: "1 min (paid)" },
        { feature: "Auto-created incidents", us: "✓ Zero clicks", them: "✗ Manual" },
        { feature: "Pre-rendered status page", us: "✓ Survives origin downtime", them: "Live-rendered" },
        { feature: "Custom domain status page", us: "Indie plan ($9/mo)", them: "Paid plans" },
        { feature: "Slack / Discord webhooks", us: "✓ Indie & up", them: "Paid plans" },
        { feature: "PagerDuty / Teams / Telegram", us: "✓ Built-in", them: "PagerDuty only" },
        { feature: "SMS alerts", us: "✓ Twilio integration", them: "✓ Built-in (extra cost)" },
        { feature: "MCP server (AI assistants)", us: "✓ Native", them: "✗ Not available" },
        { feature: "Real user monitoring (RUM)", us: "✗ Roadmap", them: "✓ Available" },
        { feature: "Self-host option", us: "✓ AGPL-3.0", them: "✗ Closed source" },
        { feature: "API access", us: "Pro plan ($29/mo)", them: "Paid plans" },
      ]}
      whenThem={
        <>
          <p>
            Pingdom is the better call if you need real user monitoring (RUM), transaction checks
            (multi-step browser flows), or you're in an enterprise environment that requires SolarWinds
            integration or compliance certifications.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            Their multi-region network is also more mature. If your monitoring SLA requires dozens of
            geographic vantage points and you have the budget, Pingdom delivers that. We're a better fit
            for developer teams who need reliable uptime checks, a branded status page, and heartbeat
            monitoring at a price that doesn't require a procurement conversation.
          </p>
        </>
      }
    />
  );
}
