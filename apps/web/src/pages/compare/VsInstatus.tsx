import { CompareLayout } from "./CompareLayout";

export function VsInstatus() {
  return (
    <CompareLayout
      competitor="Instatus"
      competitorShort="Instatus"
      headline={<>Beautiful status pages.<br /><span className="highlight">Plus the monitoring to back them up.</span></>}
      subhead="Instatus builds gorgeous status pages. UptimeCrow does that — and was built monitoring-first, so the two halves actually talk to each other: automatic incidents, auto-updated status pages, and heartbeat monitoring included."
      pitch={
        <>
          <p>
            Instatus deserves credit for making status pages look genuinely good. Their pre-rendered design
            and clean subscriber flows are some of the best in the space.
          </p>
          <p style={{ marginTop: "1rem" }}>
            The gap shows up in the monitoring side. Instatus added basic uptime checks later as an
            add-on to their core status-page product — so the integration feels bolted on. There's no
            heartbeat monitoring for cron jobs, no automatic incident creation from a failed check, and
            no MCP server for querying your status from an AI assistant.
          </p>
          <p style={{ marginTop: "1rem" }}>
            UptimeCrow was built monitoring-first: checks trigger incidents, incidents update the status
            page, and subscribers are notified — all automatically. If your status page is supposed to
            reflect reality, the monitoring feeding it should be first-class.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Plus the whole stack is <strong>AGPL-3.0 licensed and self-hostable</strong>. Instatus is
            fully closed source.
          </p>
        </>
      }
      whyUs={[
        {
          title: "Monitoring-first architecture",
          body: "UptimeCrow was built around checks, incidents, and notifications — status pages are the output. Instatus is status-page-first; monitoring was added later and shows it.",
        },
        {
          title: "Automatic incident management",
          body: "A failed check creates an incident, updates your public status page, and notifies subscribers — zero clicks. With Instatus, you create incidents manually even if monitoring detected the problem.",
        },
        {
          title: "Heartbeat monitoring (Instatus has none)",
          body: "Monitor cron jobs, backups, and scheduled tasks with unique ping URLs. Available on every plan, including free. Instatus doesn't offer heartbeat monitoring at any tier.",
        },
        {
          title: "Open-source core, AGPL-3.0",
          body: "Self-host the entire stack with Docker Compose. No vendor lock-in, no closed-source dependency. Instatus is fully proprietary.",
        },
      ]}
      rows={[
        { feature: "Starting price", us: "$0 free forever", them: "$0 free tier" },
        { feature: "Free monitors", us: "10 monitors hosted · unlimited self-host", them: "15 monitors, 2-min checks" },
        { feature: "Free status page", us: "1 status page", them: "1 status page" },
        { feature: "Free subscribers", us: "Unlimited", them: "200 subscribers" },
        { feature: "Auto-created incidents", us: "✓ From monitor checks", them: "✗ Manual only" },
        { feature: "Auto status page update", us: "✓ Automatic on state change", them: "✗ Manual" },
        { feature: "Heartbeat monitoring", us: "✓ All plans incl. free", them: "✗ Not available" },
        { feature: "Pre-rendered status page", us: "✓ Survives origin downtime", them: "✓ Jamstack-rendered" },
        { feature: "Custom domain", us: "Indie plan ($10/mo)", them: "Paid plans" },
        { feature: "Slack / Discord webhooks", us: "✓ Indie & up", them: "Paid plans" },
        { feature: "Slack / Discord / webhooks", us: "✓ Built-in", them: "Partial (higher tiers)" },
        { feature: "MCP server (AI assistants)", us: "✓ Native", them: "✗ Not available" },
        { feature: "Self-host option", us: "✓ AGPL-3.0", them: "✗ Closed source" },
        { feature: "Status page languages", us: "English", them: "30+ languages" },
      ]}
      whenThem={
        <>
          <p>
            Instatus is the stronger pick if <strong>status page design is your primary concern</strong> — their
            templates are polished and they support 30+ languages, which matters if your product has a
            global audience expecting localized incident communication.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            They're also a reasonable fit if you already manage incidents in a separate tool (PagerDuty,
            Linear, etc.) and just need a great-looking public status page to front it.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            If you want the monitoring and the status page to work together — automatic incidents, heartbeat
            checks, and an open-source self-host option — UptimeCrow is the better fit.
          </p>
        </>
      }
    />
  );
}
