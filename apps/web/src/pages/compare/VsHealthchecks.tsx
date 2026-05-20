import { CompareLayout } from "./CompareLayout";

export function VsHealthchecks() {
  return (
    <CompareLayout
      competitor="Healthchecks.io"
      competitorShort="Healthchecks"
      headline={<>Cron monitoring + full uptime.<br /><span className="highlight">Without the second vendor.</span></>}
      subhead="Healthchecks.io is the bar for cron monitoring. UptimeCrow gives you the same heartbeat reliability plus HTTP/TCP/keyword uptime checks, a public status page, and incident management — in one tool, free."
      pitch={
        <>
          <p>
            Healthchecks.io is a beloved, focused product — open-source, simple, dependable. If all you
            need is a "did my cron job run on time" alert, it's perfect.
          </p>
          <p style={{ marginTop: "1rem" }}>
            The problem starts when your stack grows. You add a SaaS endpoint that needs uptime
            monitoring. You want a public status page for customers. You want one incident timeline that
            includes both "the database backup didn't run" and "the API is returning 500s." Healthchecks
            covers only the first half.
          </p>
          <p style={{ marginTop: "1rem" }}>
            UptimeCrow treats both as first-class: <strong>heartbeat monitors for cron jobs and
            HTTP/TCP/keyword checks for your services</strong>, alerting through the same channels, on
            the same status page, into the same incident log. Plus it's the only monitoring tool with a{" "}
            <strong>native MCP server</strong> — ask Claude or Cursor whether anything is down.
          </p>
        </>
      }
      whyUs={[
        {
          title: "Uptime + heartbeats, one bill",
          body: "Most teams end up with Healthchecks + UptimeRobot + a status page tool — that's three vendors. UptimeCrow does all three from a single dashboard, free for 25 monitors.",
        },
        {
          title: "Pre-rendered status page included",
          body: "Healthchecks doesn't have status pages — you'd buy Status.io or Instatus on top. UptimeCrow generates a pre-rendered status page that stays online even if your origin is down.",
        },
        {
          title: "Automatic incident management",
          body: "When a heartbeat is late OR a monitor goes down, UptimeCrow opens an incident, updates the status page, and notifies subscribers. Healthchecks just fires a webhook.",
        },
        {
          title: "MCP server for AI assistants",
          body: "Query monitor status, schedule maintenance, or check on-call rotation from Claude or Cursor. Healthchecks has a REST API — UptimeCrow has REST + MCP.",
        },
      ]}
      rows={[
        { feature: "Starting price", us: "$0 free forever", them: "$0 free (20 checks)" },
        { feature: "Pro plan", us: "$29/mo · 50 monitors + 25 heartbeats", them: "$20/mo · 100 checks" },
        { feature: "Heartbeat / cron monitoring", us: "✓ 5 heartbeats free, 25+ on paid", them: "✓ Core product" },
        { feature: "HTTP / TCP uptime monitoring", us: "✓ All plans incl. free", them: "✗ Not available" },
        { feature: "Keyword monitoring", us: "✓ All plans incl. free", them: "✗ Not available" },
        { feature: "SSL & domain expiry alerts", us: "✓ All plans incl. free", them: "✗ Not available" },
        { feature: "Public status page", us: "✓ Pre-rendered, all plans", them: "✗ Not available" },
        { feature: "Subscriber email notifications", us: true, them: false },
        { feature: "Auto-created incidents", us: "✓ Zero clicks", them: "✗ Webhook only" },
        { feature: "Maintenance windows", us: "✓ Suppress alerts during planned downtime", them: "✓ Pause checks" },
        { feature: "Slack / Discord webhooks", us: "✓ All plans incl. free", them: "✓ Available" },
        { feature: "PagerDuty / Teams / Telegram", us: "✓ Built-in", them: "✓ Built-in" },
        { feature: "SMS alerts", us: "✓ Twilio integration", them: "Paid plans" },
        { feature: "MCP server (AI assistants)", us: "✓ Native", them: "✗ Not available" },
        { feature: "Self-host option", us: "✓ AGPL-3.0", them: "✓ BSD-licensed" },
        { feature: "API access", us: "Indie plan ($12/mo)", them: "✓ All plans" },
        { feature: "On-call rotation built-in", us: "✓ Email + SMS", them: "✗ Use PagerDuty" },
      ]}
      whenThem={
        <>
          <p>
            Healthchecks.io is the better fit if heartbeat monitoring is <em>literally all</em> you need,
            you prefer their minimalist UI, or you want a focused open-source single-vendor solution to
            self-host. It's an excellent product at exactly what it does.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            If your stack also has APIs, websites, or customer-facing endpoints that need uptime
            monitoring — and you want a public status page so customers self-serve during outages —
            UptimeCrow is the cleaner choice. One dashboard, one bill, one incident timeline.
          </p>
        </>
      }
    />
  );
}
