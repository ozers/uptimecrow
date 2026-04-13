import { CompareLayout } from "./CompareLayout";

export function VsUptimeRobot() {
  return (
    <CompareLayout
      competitor="UptimeRobot"
      competitorShort="UptimeRobot"
      headline={<>Modern UX.<br /><span className="highlight">Same price band.</span></>}
      subhead="UptimeRobot pioneered cheap uptime monitoring. UptimeCrow gives you the same price band with a better dashboard, automatic incident management, and a status page that actually looks like 2026."
      pitch={
        <>
          <p>
            UptimeRobot is a known brand with a huge install base. Their Free tier is genuinely generous
            (50 monitors, 5-minute interval), and if you just need a "did my site go down last night?"
            checker, they're hard to beat on price.
          </p>
          <p style={{ marginTop: "1rem" }}>
            The trade-off is UX: the dashboard is dated, the status page templates feel early-2010s, and
            status-page branding is limited. UptimeCrow sits in the same price band but ships a modern
            dashboard, pre-rendered status pages, custom domains on Pro, and automatic incident management.
          </p>
        </>
      }
      whyUs={[
        {
          title: "Automatic incident management",
          body: "When a monitor goes down, we open an incident, write the first status update, and update your public status page — zero clicks from you. UptimeRobot notifies you; you still have to manage the incident manually.",
        },
        {
          title: "Modern, branded status pages",
          body: "Custom domain, brand color, logo, embeddable uptime badge, and a status page that survives origin downtime because it's pre-rendered.",
        },
        {
          title: "Sub-minute detection on Pro",
          body: "30-second checks on Pro ($19) and Team. UptimeRobot's Free tier is 5-minute; paid tiers go lower but at a higher price band.",
        },
        {
          title: "Multi-region checks",
          body: "Checks from three regions on the Team plan ($49/mo) so a single region's network hiccup doesn't page your whole team.",
        },
      ]}
      rows={[
        { feature: "Free tier", us: "3 monitors, 5-min checks", them: "50 monitors, 5-min checks" },
        { feature: "Pro plan", us: "$19/mo · 20 monitors", them: "$7/mo · 10 monitors" },
        { feature: "Team plan", us: "$49/mo · 50 monitors", them: "$15/mo · 50 monitors" },
        { feature: "Min check interval", us: "30s on Pro", them: "60s on paid" },
        { feature: "Auto-created incidents", us: "✓ Zero clicks", them: "✗ Manual" },
        { feature: "Status page quality", us: "✓ Modern, custom domain", them: "Basic, limited branding" },
        { feature: "Pre-rendered status page", us: "✓ Stays up during outage", them: "Live-rendered" },
        { feature: "Scheduled maintenance windows", us: true, them: true },
        { feature: "Email subscribers", us: true, them: true },
        { feature: "Slack / Discord webhooks", us: "Pro plan", them: "Paid plans" },
        { feature: "Multi-region checks", us: "Team plan", them: "Higher tiers" },
        { feature: "Keyword monitoring", us: true, them: true },
        { feature: "Self-host option", us: "✓ MIT", them: false },
        { feature: "API access", us: "Team plan", them: "Paid plans" },
      ]}
      whenThem={
        <>
          <p>
            UptimeRobot is the better call if your monitor count is the dominant cost driver — their Free
            tier alone handles 50 monitors, which no other hosted provider matches at $0.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            If you mostly care about "did the URL return 200?" and you don't need a customer-facing status
            page or automatic incident management, UptimeRobot's pricing is genuinely hard to argue with.
            We're a better fit once you want a status page your customers actually see.
          </p>
        </>
      }
    />
  );
}
