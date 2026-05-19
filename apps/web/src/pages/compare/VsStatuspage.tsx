import { CompareLayout } from "./CompareLayout";

export function VsStatuspage() {
  return (
    <CompareLayout
      competitor="Statuspage.io (Atlassian)"
      competitorShort="Statuspage.io"
      headline={<>All-in-one monitoring.<br /><span className="highlight">Not just a status page.</span></>}
      subhead="Statuspage.io is a polished enterprise status page — but it's only a status page. UptimeCrow bundles uptime monitoring, heartbeats, incident management, and a pre-rendered status page in a single tool, starting at $0."
      pitch={
        <>
          <p>
            Statuspage.io (now an Atlassian product) pioneered the hosted status page category. It does one thing
            well: giving your users a public page to track incidents. But it has no built-in monitoring — you still
            need Pingdom, Datadog, or New Relic to actually detect outages and hook them in via API.
          </p>
          <p style={{ marginTop: "1rem" }}>
            UptimeCrow is the opposite approach: <strong>monitoring-first, status page included</strong>. HTTP, TCP,
            keyword, and heartbeat checks run automatically. When a monitor crosses the failure threshold, an incident
            is created, your subscribers are notified, and your pre-rendered status page updates — all without
            touching a third-party integration.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Statuspage.io's Starter plan is $29/mo for a status page with up to 100 subscribers — and that's before
            you pay for a monitoring tool. UptimeCrow's free tier gives you <strong>50 monitors, heartbeats, and a
            status page for $0</strong>. The paid Indie plan is $12/mo for the full stack. And because
            UptimeCrow is <strong>MIT-licensed and self-hostable</strong>, you're never locked into a vendor
            that may be sunset or repriced by an enterprise acquirer.
          </p>
        </>
      }
      whyUs={[
        {
          title: "Monitoring is built in — not bolted on",
          body: "HTTP, TCP, keyword, SSL, domain expiry, and heartbeat checks run out of the box. Statuspage.io requires a separate monitoring tool and API integration to detect anything automatically.",
        },
        {
          title: "Free forever — with real monitors",
          body: "50 monitors, 1 status page, heartbeats, Slack/Discord alerts — all at $0. Statuspage.io has no free tier; even their cheapest plan starts at $29/mo for a status page alone.",
        },
        {
          title: "Status page that survives origin downtime",
          body: "Pages are pre-rendered to static HTML on every state change. If your API goes down, subscribers still see the latest incident state — no live database query on every page load.",
        },
        {
          title: "Open source and self-hostable",
          body: "The entire stack is MIT-licensed. One Docker Compose command and you're running UptimeCrow on your own infrastructure — no Atlassian contract required, no data leaving your network.",
        },
        {
          title: "Native MCP server for AI assistants",
          body: "Query monitor status, list active incidents, and check heartbeats directly from Claude, Cursor, or any MCP-compatible AI assistant. Statuspage.io has no equivalent.",
        },
        {
          title: "Developer API on every paid plan",
          body: "REST JSON API plus an Atom/RSS feed on the Indie plan ($12/mo). Full programmatic incident management without needing an Enterprise contract.",
        },
      ]}
      rows={[
        { feature: "Free tier", us: "✓ 50 monitors + 1 status page", them: "✗ None" },
        { feature: "Starting price", us: "$0 free / $12 paid (full stack)", them: "$29/mo — status page only" },
        { feature: "Uptime monitoring", us: "✓ Built-in (HTTP, TCP, keyword)", them: "✗ Requires Pingdom/Datadog add-on" },
        { feature: "Heartbeat / cron monitoring", us: true, them: false },
        { feature: "Auto-created incidents from checks", us: true, them: false, note: "Statuspage incidents are created manually or via API from your monitoring tool." },
        { feature: "Pre-rendered static status page", us: "✓ Survives origin downtime", them: "✓ CDN-served", note: "Both survive origin; UptimeCrow pre-renders on state change so no DB query needed." },
        { feature: "Email subscribers", us: true, them: true },
        { feature: "Slack notifications", us: true, them: true },
        { feature: "Microsoft Teams notifications", us: true, them: true },
        { feature: "Atom / RSS feed", us: true, them: true },
        { feature: "Custom domain", us: "✓ Indie plan ($12/mo)", them: "✓ All paid plans" },
        { feature: "Status page themes", us: "✗ Single clean theme", them: "✓ Multiple templates" },
        { feature: "Subscriber count limit", us: "✓ Unlimited on all plans", them: "Limited by tier (100 on Starter)" },
        { feature: "Incident templates", us: "✓ 9 built-in templates", them: "✓ Yes" },
        { feature: "Team seats", us: "✓ Up to 10 (Team plan)", them: "✓ Unlimited (Enterprise)" },
        { feature: "API access", us: "✓ Indie plan ($12/mo)", them: "✓ Enterprise tier" },
        { feature: "MCP server (AI assistants)", us: "✓ Native — only uptime tool with this", them: "✗ Not available" },
        { feature: "Open source", us: "✓ MIT licensed", them: false },
        { feature: "Self-host option", us: "✓ Docker Compose", them: "✗ SaaS only" },
        { feature: "SOC2 Type II", us: "✗ Not certified", them: true },
        { feature: "White-label branding", us: "✗ Not available", them: "✓ Enterprise tier" },
        { feature: "Atlassian ecosystem integration", us: false, them: "✓ Jira, Confluence, PagerDuty" },
      ]}
      whenThem={
        <>
          <p>
            Statuspage.io is the right call if your organization is deep in the Atlassian ecosystem — Jira Software,
            Confluence, and PagerDuty integrations work seamlessly, and an existing enterprise contract may already
            cover it.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            It's also worth considering if you have 10,000+ subscribers and need granular subscriber tier
            management, or if your compliance context requires SOC2 Type II certification and white-label branding
            on an enterprise SLA. Atlassian's infrastructure and support organization is significantly larger than
            ours.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            For everyone else — especially developers and small-to-mid-size teams — paying $29/mo for a status page
            and then separately paying for a monitoring tool doesn't make sense when UptimeCrow covers both for $0
            to $12/mo.
          </p>
        </>
      }
    />
  );
}
