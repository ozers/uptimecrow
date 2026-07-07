import { CompareLayout } from "./CompareLayout";

export function VsFreshping() {
  return (
    <CompareLayout
      competitor="Freshping"
      competitorShort="Freshping"
      headline={<>Freshping is gone.<br /><span className="highlight">Your monitoring doesn't have to be.</span></>}
      subhead="Freshping shut down on March 6, 2026. If you're looking for a replacement with a generous free tier, automatic incident management, and a status page that looks good — UptimeCrow is a direct upgrade."
      pitch={
        <>
          <p>
            Freshping was a great tool: 50 free monitors, 1-minute checks, decent status pages, all backed by Freshworks.
            When the shutdown was announced, a lot of teams were left scrambling for alternatives.
          </p>
          <p style={{ marginTop: "1rem" }}>
            UptimeCrow picks up where Freshping left off — and goes further. You get <strong>automatic incident
            creation and status page updates</strong> the moment a monitor goes down, heartbeat monitoring for your
            cron jobs, email/Slack/Discord/webhook alerts, and a pre-rendered status page that stays
            online even if your own origin goes down. All on a free tier, no credit card required.
          </p>
          <p style={{ marginTop: "1rem" }}>
            And if you'd rather not depend on another hosted service again, the entire stack is{" "}
            <strong>AGPL-3.0 licensed and self-hostable</strong> with a single Docker Compose command.
          </p>
        </>
      }
      whyUs={[
        {
          title: "Free hosted, or self-host unlimited",
          body: "10 uptime monitors, 3 heartbeat monitors, 1 status page, and 5-minute checks on the hosted free tier — no trial, no credit card. Need more? Self-host unlimited under AGPL-3.0.",
        },
        {
          title: "Automatic incident management",
          body: "When a monitor goes down, an incident is opened, the status page is updated, and subscribers are notified — all without any action from you. Freshping sent alerts; you still had to manage the incident.",
        },
        {
          title: "Status page that survives outages",
          body: "UptimeCrow pre-renders your status page to static HTML. If your API is down, your status page is still up — served directly, no origin needed.",
        },
        {
          title: "Open-source core — no more surprise shutdowns",
          body: "The entire stack is AGPL-3.0 licensed on GitHub. Self-host it yourself with Docker Compose, or use our managed cloud. Either way, you own your data and your setup.",
        },
      ]}
      rows={[
        { feature: "Service status", us: "✓ Active", them: "✗ Shut down March 2026" },
        { feature: "Free tier monitors", us: "10 monitors · unlimited self-host", them: "Was 50 monitors" },
        { feature: "Free check interval", us: "5 minutes", them: "Was 1 minute" },
        { feature: "Heartbeat monitoring", us: "✓ All plans incl. free", them: "✗ Not available" },
        { feature: "Auto-created incidents", us: "✓ Zero clicks", them: "✗ Manual" },
        { feature: "Status page auto-update", us: "✓ Automatic", them: "✗ Manual" },
        { feature: "Pre-rendered status page", us: "✓ Survives origin downtime", them: "Live-rendered" },
        { feature: "Slack / Discord webhooks", us: "✓ Indie & up", them: "Paid plans" },
        { feature: "Slack / Discord / webhooks", us: "✓ Built-in", them: "✗ Limited" },
        { feature: "MCP server (AI assistants)", us: "✓ Native", them: "✗ Not available" },
        { feature: "Self-host option", us: "✓ AGPL-3.0", them: "✗ Closed source" },
        { feature: "Custom domain status page", us: "Indie plan ($10/mo)", them: "Was paid" },
        { feature: "Data you can export", us: "✓ REST API", them: "✗ Gone with the service" },
      ]}
      whenThem={
        <>
          <p>
            There's no "when to use Freshping" anymore — the service is offline. If you had monitors,
            status pages, or subscriber lists there, they're gone.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            The closest Freshping replacement in terms of free-tier monitor count is UptimeRobot (50 free),
            but it lacks automatic incident management and heartbeat monitoring. If those features matter
            to you — and they probably do — UptimeCrow is the more complete migration target.
          </p>
        </>
      }
    />
  );
}
