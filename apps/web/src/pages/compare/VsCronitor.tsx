import { CompareLayout } from "./CompareLayout";

export function VsCronitor() {
  return (
    <CompareLayout
      competitor="Cronitor"
      competitorShort="Cronitor"
      headline={<>Uptime + heartbeats.<br /><span className="highlight">One tool, one bill.</span></>}
      subhead="Cronitor is great at cron job monitoring. UptimeCrow does cron monitoring and full uptime monitoring with status pages, incident management, and alerting — all in one place, starting free."
      pitch={
        <>
          <p>
            Cronitor built a strong product around one problem: making sure your scheduled jobs actually run.
            If heartbeat monitoring is your primary use case, they've nailed the developer experience with
            Telemetry SDKs and detailed run history.
          </p>
          <p style={{ marginTop: "1rem" }}>
            The gap appears when you also need uptime monitoring for HTTP endpoints and a public status page
            for your customers. Cronitor's uptime monitoring is secondary to their heartbeat product, and
            status pages are a paid add-on with limited customization.
          </p>
          <p style={{ marginTop: "1rem" }}>
            UptimeCrow treats both use cases as first-class: <strong>heartbeat monitors for your cron
            jobs and HTTP/TCP/keyword checks for your services</strong>, all feeding into a single incident
            timeline and a pre-rendered status page that stays online even during an outage. And it's the
            only monitoring tool with a{" "}
            <strong>native MCP server</strong> — ask your AI assistant which monitors are down without
            opening a dashboard.
          </p>
        </>
      }
      whyUs={[
        {
          title: "Uptime + heartbeats in one tool",
          body: "Stop paying separately for an uptime monitor and a cron monitor. UptimeCrow handles both with a single dashboard, single status page, and shared incident timeline.",
        },
        {
          title: "Pre-rendered status page included",
          body: "UptimeCrow generates your status page as static HTML — it stays online even if your own services are down. Cronitor's status pages are live-rendered and a paid feature.",
        },
        {
          title: "Automatic incident management",
          body: "When any monitor (uptime or heartbeat) trips, an incident is created, the status page updates, and subscribers are notified — zero manual steps.",
        },
        {
          title: "MCP server for AI-assisted operations",
          body: "The only monitoring tool with a native MCP server. Query which monitors are down, acknowledge incidents, or check uptime percentages directly from Claude or Cursor.",
        },
      ]}
      rows={[
        { feature: "Starting price", us: "$0 free forever", them: "$0 free (3 monitors)" },
        { feature: "Pro plan", us: "$29/mo · 100 monitors", them: "$29/mo · limited monitors" },
        { feature: "HTTP / TCP uptime monitoring", us: "✓ All plans incl. free", them: "✓ Available" },
        { feature: "Heartbeat / cron monitoring", us: "✓ All plans incl. free", them: "✓ Core product" },
        { feature: "Min check interval", us: "30s Pro/Team · 1 min Free/Indie", them: "1 min paid" },
        { feature: "Auto-created incidents", us: "✓ Zero clicks", them: "✗ Alert only" },
        { feature: "Status page", us: "✓ Pre-rendered, all plans", them: "Paid add-on, live-rendered" },
        { feature: "Custom domain status page", us: "Indie plan ($9/mo)", them: "Paid plans" },
        { feature: "Pre-rendered status page", us: "✓ Survives origin downtime", them: "✗ Live-rendered" },
        { feature: "Subscriber email notifications", us: true, them: true },
        { feature: "Slack / Discord webhooks", us: "✓ All plans incl. free", them: "Paid plans" },
        { feature: "PagerDuty / Teams / Telegram", us: "✓ Built-in", them: "PagerDuty (paid)" },
        { feature: "SMS alerts", us: "✓ Twilio integration", them: "Paid plans" },
        { feature: "MCP server (AI assistants)", us: "✓ Native", them: "✗ Not available" },
        { feature: "Self-host option", us: "✓ AGPL-3.0", them: "✗ Closed source" },
        { feature: "API access", us: "Pro plan ($29/mo)", them: "Pro plan" },
        { feature: "Telemetry SDK", us: "✗ REST API only", them: "✓ Native SDKs" },
      ]}
      whenThem={
        <>
          <p>
            Cronitor is the better call if cron job observability is your primary concern and you want
            native SDK integrations for Python, Ruby, Go, PHP, Node, and shell scripts. Their{" "}
            <code style={{ fontSize: "0.9em", padding: "0 0.3em" }}>cronitor exec</code> wrapper and
            Telemetry API give you richer run history than a simple heartbeat ping.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            If you need both uptime checks <em>and</em> heartbeat monitoring under a single incident timeline
            with a public status page, UptimeCrow is the cleaner choice — and you'll likely pay less for it.
          </p>
        </>
      }
    />
  );
}
