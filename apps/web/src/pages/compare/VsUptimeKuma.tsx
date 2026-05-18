import { CompareLayout } from "./CompareLayout";

export function VsUptimeKuma() {
  return (
    <CompareLayout
      competitor="Uptime Kuma"
      competitorShort="Uptime Kuma"
      headline={<>We love Uptime Kuma.<br /><span className="highlight">Here's what it's missing.</span></>}
      subhead="Uptime Kuma is a fantastic open-source monitor with 86k GitHub stars. It does one thing brilliantly. UptimeCrow picks up where it stops: REST API, multi-user teams, managed hosting, multi-region checks, and an MCP server for AI tooling."
      pitch={
        <>
          <p>
            Uptime Kuma deserves all its GitHub stars. It's free, self-hostable, has 90+ notification integrations,
            and a clean UI that's easy to set up. If you're a solo developer running a homelab, Kuma is hard
            to beat at $0.
          </p>
          <p style={{ marginTop: "1rem" }}>
            The friction shows up at the edges. Kuma has <strong>no REST API</strong> — you can't create or update
            monitors programmatically, integrate with Terraform, or query status from a script or AI assistant.
            It has <strong>no multi-user support</strong>, so you can't add a teammate without sharing your
            admin credentials. And it's <strong>single-node</strong> — no multi-region checks, no managed
            backups, and no SaaS option if you'd rather not run your own server.
          </p>
          <p style={{ marginTop: "1rem" }}>
            UptimeCrow is MIT-licensed and self-hostable too — so you keep everything you love about Kuma —
            but adds a full REST API, multi-user orgs, managed cloud hosting, multi-region checks, and an
            MCP server so you can query your monitors from Claude, Cursor, or Windsurf.
          </p>
        </>
      }
      whyUs={[
        {
          title: "Full REST API (Kuma has none)",
          body: "Create, update, and query monitors via API. Use it with Terraform, CI/CD pipelines, scripts, or any HTTP client. Kuma's #1 community complaint — solved.",
        },
        {
          title: "Multi-user organizations",
          body: "Invite teammates, share a dashboard, and manage monitors together. Kuma is single-user — if someone else needs access, they get your password.",
        },
        {
          title: "MCP server for AI assistants",
          body: "Ask Claude or Cursor 'Is my API up?' without leaving your editor. UptimeCrow ships a native MCP server — the only uptime tool that does. Kuma has no AI integration.",
        },
        {
          title: "Managed cloud or self-host — your choice",
          body: "Use our managed SaaS and skip the server maintenance, or self-host with Docker Compose exactly like Kuma. UptimeCrow is also MIT-licensed, so you're never locked in.",
        },
      ]}
      rows={[
        { feature: "Self-host option", us: "✓ MIT-licensed", them: "✓ MIT-licensed" },
        { feature: "Managed SaaS", us: "✓ Free + paid plans", them: "✗ Self-host only" },
        { feature: "REST API", us: "✓ Full CRUD API", them: "✗ Not available", note: "Kuma's most-requested feature" },
        { feature: "Multi-user / teams", us: "✓ Org-based multi-user", them: "✗ Single user" },
        { feature: "MCP server (AI assistants)", us: "✓ Native", them: "✗ Not available" },
        { feature: "Multi-region checks", us: "Team plan", them: "✗ Single-node" },
        { feature: "Notification integrations", us: "Email, Slack, Discord, PagerDuty, Teams, Telegram", them: "90+ integrations" },
        { feature: "Heartbeat / cron monitoring", us: "✓ All plans", them: "✓ Available" },
        { feature: "Maintenance windows", us: "✓ Dashboard + status page", them: "✓ Available" },
        { feature: "Automatic incident management", us: "✓ Auto-created + auto-resolved", them: "✗ No incident tracking" },
        { feature: "Subscriber email notifications", us: "✓ Double opt-in", them: "✗ Not available" },
        { feature: "Custom domain status page", us: "Indie plan ($12/mo)", them: "✗ Not available" },
        { feature: "Pre-rendered status page", us: "✓ Survives origin downtime", them: "Live-rendered" },
        { feature: "Database", us: "PostgreSQL", them: "SQLite / MariaDB" },
        { feature: "Free tier", us: "25 monitors, SaaS", them: "Unlimited, self-host" },
      ]}
      whenThem={
        <>
          <p>
            Uptime Kuma is the right call if you're a solo developer who wants <strong>zero cost</strong> and{" "}
            <strong>maximum notification integrations</strong> — Kuma's 90+ integrations list is unmatched.
            If you're already running your own server and don't need a REST API or multi-user access,
            Kuma is a perfectly good choice.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            The moment you need a teammate to have dashboard access, want to create monitors from a script or
            CI pipeline, or prefer not to maintain another server, UptimeCrow is the natural next step.
            It's MIT-licensed just like Kuma — you can even migrate your monitors and self-host UptimeCrow
            on the same machine.
          </p>
        </>
      }
    />
  );
}
