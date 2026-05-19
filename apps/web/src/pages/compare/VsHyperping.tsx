import { CompareLayout } from "./CompareLayout";

export function VsHyperping() {
  return (
    <CompareLayout
      competitor="Hyperping"
      competitorShort="Hyperping"
      headline={<>Same monitoring.<br /><span className="highlight">Half the price.</span></>}
      subhead="Hyperping's Essentials plan is $24/mo. UptimeCrow's comparable Indie plan is $12/mo — and we're MIT-licensed, self-hostable, and include a native MCP server for AI assistants."
      pitch={
        <>
          <p>
            Hyperping positions itself as an "all-in-one" replacement that bundles uptime monitoring, status
            pages, and on-call alerting. It's a well-designed product. But when you price it out, you're
            paying a 2x premium at the Essentials tier compared to UptimeCrow's Indie plan for the same
            core feature set.
          </p>
          <p style={{ marginTop: "1rem" }}>
            UptimeCrow covers every use case Hyperping targets — <strong>HTTP, TCP, heartbeat checks, pre-rendered
            status pages, on-call scheduling, and multi-channel alerts</strong> — for less. The Indie plan at
            $12/mo gives you custom domain status pages and API access. Pro at $29/mo matches or beats
            Hyperping's $74/mo Pro plan on monitor counts.
          </p>
          <p style={{ marginTop: "1rem" }}>
            And UptimeCrow does things Hyperping can't: the <strong>MIT-licensed source</strong> means you can
            audit every line, self-host with a single Docker Compose command, and never face a forced vendor
            migration. The <strong>native MCP server</strong> lets Claude, Cursor, or Windsurf query your
            monitor status in real time — no browser tab required.
          </p>
        </>
      }
      whyUs={[
        {
          title: "Half the price at the first paid tier",
          body: "Hyperping Essentials is $24/mo. UptimeCrow Indie is $12/mo. Both give you a custom domain status page and the core monitoring suite. You keep the other $12 every month.",
        },
        {
          title: "MIT open source — Hyperping is closed",
          body: "Self-host the full UptimeCrow stack with Docker Compose. No pricing changes, no sunset risk, no data residency worries. Hyperping has no self-host option.",
        },
        {
          title: "Native MCP server for AI workflows",
          body: "The only uptime monitor with a built-in Model Context Protocol server. Ask your AI assistant which monitors are down, acknowledge incidents, or check uptime percentages — without opening a browser tab.",
        },
        {
          title: "Tools suite included",
          body: "SSL certificate checker, DNS lookup, and on-demand uptime tester — public, no login required. Useful standalone, especially in debugging workflows where you need a quick external perspective.",
        },
        {
          title: "Slow response threshold alerting",
          body: "Get alerted when your endpoint is technically up but responding too slowly — before users start complaining. Configure a response time threshold per monitor.",
        },
        {
          title: "Pre-rendered status pages that survive outages",
          body: "Status pages are generated as static HTML on every state change. They serve from disk — no database hit on render — so they stay online even when your origin is down.",
        },
      ]}
      rows={[
        { feature: "Starting price", us: "$0 free forever", them: "Free (20 monitors, limited)" },
        { feature: "First paid tier", us: "$12/mo — Indie", them: "$24/mo — Essentials" },
        { feature: "Monitors on first paid tier", us: "30 monitors", them: "50 monitors" },
        { feature: "Pro plan", us: "$29/mo · 50 monitors", them: "$74/mo · more monitors" },
        { feature: "Business / Team plan", us: "$79/mo · 200 monitors · 10 seats", them: "$249/mo · on-call + SAML" },
        { feature: "Minimum check interval", us: "30s Pro/Team · 60s Free/Indie", them: "30s Essentials+" },
        { feature: "HTTP / TCP monitoring", us: "✓ All plans incl. free", them: "✓ All plans" },
        { feature: "Heartbeat / cron monitoring", us: "✓ All plans incl. free", them: "✓ Available" },
        { feature: "Keyword / content checks", us: "✓ All plans incl. free", them: "✓ Available" },
        { feature: "Slow response threshold", us: "✓ All plans", them: "Paid plans" },
        { feature: "Auto-created incidents", us: "✓ Zero clicks", them: "✓ Available" },
        { feature: "Status page", us: "✓ Pre-rendered, all plans", them: "✓ Available" },
        { feature: "Custom domain status page", us: "Indie plan ($12/mo)", them: "Essentials ($24/mo)" },
        { feature: "Pre-rendered status page", us: "✓ Survives origin downtime", them: "✗ Live-rendered" },
        { feature: "On-call scheduling", us: "✓ All paid plans", them: "Business plan ($249/mo)" },
        { feature: "SAML / SSO", us: "Team plan", them: "Business plan ($249/mo)" },
        { feature: "MCP server (AI assistants)", us: "✓ Native — unique feature", them: "✗ Not available" },
        { feature: "Tools suite (SSL, DNS, uptime)", us: "✓ Public, no login", them: "✗ Not available" },
        { feature: "Self-host option", us: "✓ MIT-licensed", them: "✗ Closed source" },
        { feature: "Multi-region checks", us: "Team plan ($79/mo)", them: "Pro+ ($74/mo)" },
        { feature: "API access", us: "Indie plan ($12/mo)", them: "Paid plans" },
        { feature: "Slack / Discord webhooks", us: "✓ All plans incl. free", them: "Paid plans" },
        { feature: "PagerDuty / Teams / Telegram", us: "✓ All paid plans", them: "Essentials+" },
      ]}
      whenThem={
        <>
          <p>
            Hyperping is the better call if you need a higher monitor count at the Essentials tier (they offer
            50 vs our 25 on first paid) and need mature on-call rotation scheduling right now. Their Business
            plan at $249/mo includes SAML and enterprise on-call features we don't match at that tier yet.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            If your priority is price, open-source trust, AI-assistant integration, or self-hosting,
            UptimeCrow is the stronger choice — and for most developer teams and small businesses,
            30 monitors at $12/mo is more than enough.
          </p>
        </>
      }
    />
  );
}
