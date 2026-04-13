import { CompareLayout } from "./CompareLayout";

export function VsBetterStack() {
  return (
    <CompareLayout
      competitor="BetterStack"
      competitorShort="BetterStack"
      headline={<>Fair pricing.<br /><span className="highlight">The same core monitoring.</span></>}
      subhead="UptimeCrow covers the same uptime and status-page ground as BetterStack Uptime, at a fraction of the price, with an open-source core you can self-host if you ever want to."
      pitch={
        <>
          <p>
            BetterStack is a polished, well-marketed product bundling uptime monitoring, logs, and incident management.
            If you need log aggregation, on-call rotations, and deep third-party integrations all under one roof,
            their pricing probably makes sense.
          </p>
          <p style={{ marginTop: "1rem" }}>
            If all you actually need is <strong>checks, incidents, and a branded status page</strong>, UptimeCrow
            does that for $19/mo instead of $29-$200/mo. The status page itself is pre-rendered so it stays online
            when your origin is down — a scenario a live-rendered status page can't always survive.
          </p>
        </>
      }
      whyUs={[
        {
          title: "Status page that survives outages",
          body: "Your status page is pre-rendered HTML served from the edge. If your API is down — or your status page renderer is down — users still see the latest state.",
        },
        {
          title: "Transparent, flat pricing",
          body: "$0 free forever, $19/mo Pro, $49/mo Team. No seat-based pricing, no usage surprises, no 'call sales for Team features'.",
        },
        {
          title: "Open source core, MIT-licensed",
          body: "Self-host the entire stack with Docker Compose if you ever need to. No vendor lock-in, no data residency headaches.",
        },
        {
          title: "Developer-first UX",
          body: "Hono + React stack, readable codebase, straightforward API. If you want to extend or integrate, you can — and you can read how any feature works by opening the repo.",
        },
      ]}
      rows={[
        { feature: "Starting price", us: "$0 free forever", them: "Free trial, then from $29/mo" },
        { feature: "Pro plan", us: "$19/mo · 20 monitors", them: "$29/mo · 10 monitors" },
        { feature: "Minimum check interval", us: "30 seconds", them: "30 seconds" },
        { feature: "Multi-region checks", us: "Team plan ($49/mo)", them: "Paid plans" },
        { feature: "Auto-created incidents", us: true, them: true },
        { feature: "Custom domain status page", us: "Pro plan", them: "Paid plans" },
        { feature: "Pre-rendered status page", us: "✓ Survives origin downtime", them: "Live-rendered", note: "Matters when your own outage takes down your status page." },
        { feature: "Scheduled maintenance windows", us: true, them: true },
        { feature: "Subscriber email notifications", us: true, them: true },
        { feature: "Slack / Discord webhooks", us: "Pro plan", them: "Paid plans" },
        { feature: "Self-host option", us: "✓ MIT", them: false },
        { feature: "API access", us: "Team plan", them: "Paid plans" },
        { feature: "On-call rotations", us: "Not yet", them: true },
        { feature: "Log aggregation", us: false, them: true },
        { feature: "Synthetic browser monitoring", us: "Roadmap", them: true },
      ]}
      whenThem={
        <>
          <p>
            BetterStack is the better call if you need log aggregation next to your uptime data, PagerDuty-style
            on-call rotations with escalations, or dozens of pre-built integrations (PagerDuty, OpsGenie,
            VictorOps, Zendesk, and so on).
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            Their platform is more mature; their price reflects that. We're a better fit for teams who want
            monitoring and status pages without the overhead of a full incident-management suite.
          </p>
        </>
      }
    />
  );
}
