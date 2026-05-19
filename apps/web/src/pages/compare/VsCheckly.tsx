import { CompareLayout } from "./CompareLayout";

export function VsCheckly() {
  return (
    <CompareLayout
      competitor="Checkly"
      competitorShort="Checkly"
      headline={<>Uptime monitoring,<br /><span className="highlight">not E2E testing.</span></>}
      subhead="Checkly is a powerful Playwright-based synthetic testing platform. If your goal is 'is my site up and my users can see a status page', UptimeCrow does that from $0 — with status pages, heartbeats, and a native MCP server included."
      pitch={
        <>
          <p>
            Checkly and UptimeCrow answer different questions. Checkly answers: "does my user
            journey — add to cart, log in, complete checkout — work end-to-end?" That's a
            Playwright-driven browser automation question, and Checkly does it very well.
          </p>
          <p style={{ marginTop: "1rem" }}>
            UptimeCrow answers: "is my API endpoint responding? Is my cron job running? Is my
            status page showing the right state to customers?" That's the HTTP/TCP/heartbeat
            uptime question — and it's what most developer teams actually need, at a fraction
            of the price.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Many teams default to Checkly for uptime because it's in their CI pipeline — but
            they're paying $40–$120/mo and missing features like <strong>public status pages,
            heartbeat monitoring, and on-call scheduling</strong> that Checkly simply doesn't
            offer. UptimeCrow starts at{" "}
            <strong>$0 with 50 monitors</strong>, includes pre-rendered status pages on every plan,
            and ships a <strong>native MCP server</strong> so your AI assistant always knows your
            production health.
          </p>
        </>
      }
      whyUs={[
        {
          title: "Status pages — Checkly has none",
          body: "Checkly has no public status page product. UptimeCrow includes a pre-rendered status page on every plan, including the free tier. Customers can see what's down without emailing support.",
        },
        {
          title: "Heartbeat / cron monitoring included",
          body: "Checkly doesn't do heartbeats. UptimeCrow includes heartbeat monitors on every plan so your cron jobs, backups, and queue workers are covered alongside your HTTP checks.",
        },
        {
          title: "Simpler, lower-cost uptime monitoring",
          body: "Checkly Starter is $40/mo for 50 uptime checks. UptimeCrow Free gives you 50 monitors for $0, and Pro gives you 50 monitors for $29/mo. If you don't need Playwright browser tests, you're overpaying.",
        },
        {
          title: "On-call scheduling built in",
          body: "UptimeCrow includes on-call rotation scheduling on paid plans. When a monitor goes down at 3am, the right person gets paged — not a static email alias. Checkly has no on-call routing.",
        },
        {
          title: "MIT open source, self-hostable",
          body: "The entire UptimeCrow stack is MIT-licensed and runs with docker compose up. Self-host on any VPS. Checkly is closed-source SaaS only.",
        },
        {
          title: "Native MCP server",
          body: "UptimeCrow is the only uptime monitor with a built-in Model Context Protocol server. Query monitor status from Claude Code, Cursor, or Windsurf without opening a browser.",
        },
      ]}
      rows={[
        { feature: "Starting price", us: "$0 free forever", them: "Hobby free (10 checks, limited)" },
        { feature: "First paid tier", us: "$12/mo — Indie (30 monitors)", them: "$40/mo — Starter (50 uptime checks)" },
        { feature: "Pro / Team plan", us: "$29/mo · 50 monitors", them: "$120/mo · Team (50 uptime + browser)" },
        { feature: "HTTP / TCP uptime monitoring", us: "✓ All plans incl. free", them: "✓ All plans" },
        { feature: "Heartbeat / cron monitoring", us: "✓ All plans incl. free", them: "✗ Not available" },
        { feature: "Playwright browser tests", us: "✗ (roadmap)", them: "✓ Core product" },
        { feature: "Keyword / content checks", us: "✓ All plans", them: "✓ Available" },
        { feature: "Slow response threshold", us: "✓ All plans", them: "Paid plans" },
        { feature: "Public status page", us: "✓ Pre-rendered, all plans", them: "✗ Not available" },
        { feature: "Custom domain status page", us: "Indie plan ($12/mo)", them: "✗ Not available" },
        { feature: "Pre-rendered status page", us: "✓ Survives origin downtime", them: "✗ N/A" },
        { feature: "Auto-created incidents", us: "✓ Zero clicks", them: "✗ Alert only" },
        { feature: "On-call scheduling", us: "✓ Paid plans", them: "✗ Not available" },
        { feature: "Subscriber notifications", us: "✓ All plans incl. free", them: "✗ Not available" },
        { feature: "Slack / Discord webhooks", us: "✓ All plans incl. free", them: "✓ Paid plans" },
        { feature: "PagerDuty integration", us: "✓ All paid plans", them: "✓ Paid plans" },
        { feature: "MCP server (AI assistants)", us: "✓ Native — unique feature", them: "✗ Not available" },
        { feature: "Self-host option", us: "✓ MIT-licensed", them: "✗ Closed source" },
        { feature: "Monitoring as code (Terraform/CLI)", us: "API / REST", them: "✓ Native CLI + Terraform" },
        { feature: "Multi-region checks", us: "Team plan ($79/mo)", them: "All paid plans" },
        { feature: "API access", us: "Indie plan ($12/mo)", them: "All paid plans" },
      ]}
      whenThem={
        <>
          <p>
            Checkly is the right call when you need <strong>Playwright-based end-to-end browser
            automation</strong> as part of your monitoring strategy — verifying that user journeys
            like login, signup, or checkout work correctly from a real browser, not just that the
            endpoint returns 200. If "monitoring as code" with Terraform or a CLI-driven workflow is
            important to your team, Checkly's tooling is also more mature.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            If your requirement is "is my server responding, can customers see my status page, and
            did my cron job run?" — that's UptimeCrow's exact use case, and you'll pay 66–100% less
            for it.
          </p>
        </>
      }
    />
  );
}
