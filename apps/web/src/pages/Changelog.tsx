import { Link } from "react-router-dom";
import { MarketingNav, MarketingFooter } from "@/components/marketing-nav";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/lib/meta";

interface ChangelogEntry {
  date: string;
  version?: string;
  title: string;
  type: "feature" | "improvement" | "fix" | "security";
  body: string;
}

// Newest first. Keep the body short — link to docs for the long form.
const ENTRIES: ChangelogEntry[] = [
  {
    date: "2026-05-18",
    title: "Slow-response alerts · 3 new free tools",
    type: "feature",
    body: "New slow-response alerts notify you when a monitor stays up but degrades past a configurable threshold. Launched three free public tools — SSL Checker, DNS Lookup, and Uptime Tester — at /tools.",
  },
  {
    date: "2026-05-12",
    title: "Analytics: Umami Cloud tracker hardcoded",
    type: "improvement",
    body: "Switched away from build-time domain variable. Tracker now loads consistently across environments.",
  },
  {
    date: "2026-05-10",
    title: "SEO/GEO: llms.txt, FAQ JSON-LD, AI crawler allowlist",
    type: "feature",
    body: "Added llms.txt and llms-full.txt for AI search engines, FAQPage JSON-LD in static HTML for non-JS crawlers, and an explicit robots.txt allowlist for CCBot, GPTBot, ClaudeBot, PerplexityBot, and friends.",
  },
  {
    date: "2026-05-08",
    title: "Security hardening: SSRF guard · CORS · login enumeration",
    type: "security",
    body: "Added a server-side SSRF guard that rejects private/internal targets, locked CORS to APP_URL in production, and made login responses identical for invalid email vs invalid password.",
  },
  {
    date: "2026-05-05",
    title: "On-call rotation",
    type: "feature",
    body: "Built-in on-call schedule with rotation and email + SMS notifications when an incident opens. No more PagerDuty bill for small teams.",
  },
  {
    date: "2026-05-01",
    title: "PagerDuty, Microsoft Teams, Telegram integrations",
    type: "feature",
    body: "Three new notification channels alongside the existing Slack/Discord/webhook/email. Configure in Settings.",
  },
  {
    date: "2026-04-28",
    title: "MCP server",
    type: "feature",
    body: "Native Model Context Protocol server at /api/mcp. Query monitor status, list incidents, and create monitors from Claude, Cursor, or any MCP-aware AI assistant.",
  },
  {
    date: "2026-04-20",
    title: "SSL & domain expiry monitoring",
    type: "feature",
    body: "Every HTTPS monitor now also checks SSL certificate expiry daily, and every monitor checks WHOIS domain expiry. Configurable warning thresholds per monitor; alerts via email + Slack + Discord.",
  },
  {
    date: "2026-04-15",
    title: "Maintenance windows",
    type: "feature",
    body: "Schedule planned downtime windows per monitor. Failures during the window don't create incidents or page on-call.",
  },
  {
    date: "2026-04-10",
    title: "Twilio SMS alerts",
    type: "feature",
    body: "Bring your own Twilio credentials to receive SMS alerts on incidents. Stored encrypted, masked in the API response.",
  },
];

// Semantic token classes per type — theme-aware, no hardcoded hex.
const TYPE_STYLES: Record<ChangelogEntry["type"], { className: string; label: string }> = {
  feature: { className: "border-brand/40 bg-brand/10 text-brand", label: "Feature" },
  improvement: { className: "border-info/40 bg-info/10 text-info-foreground", label: "Improvement" },
  fix: { className: "border-border bg-secondary text-muted-foreground", label: "Fix" },
  security: { className: "border-danger/40 bg-danger/10 text-danger-foreground", label: "Security" },
};

export default function Changelog() {
  usePageMeta({
    title: "Changelog — UptimeCrow",
    description:
      "Every feature, improvement, fix, and security update we ship — in chronological order. UptimeCrow is built in the open.",
    canonical: "https://uptimecrow.com/changelog",
  });

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* HERO */}
      <section className="mx-auto max-w-4xl px-6 pb-8 pt-20 text-center sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">
          Built in the open
        </p>
        <h1 className="mt-4 font-display text-[42px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[50px]">
          Changelog
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground">
          Every shipped feature, improvement, and security update. Newest first.
        </p>
      </section>

      {/* ENTRIES */}
      <section className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
        <ol className="space-y-3">
          {ENTRIES.map((entry) => {
            const meta = TYPE_STYLES[entry.type];
            return (
              <li
                key={`${entry.date}-${entry.title}`}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                  <time
                    className="font-mono text-[12px] tnum text-muted-foreground"
                    dateTime={entry.date}
                  >
                    {entry.date}
                  </time>
                </div>
                <h3 className="mt-3 font-display text-[17px] font-bold tracking-[-0.02em]">
                  {entry.title}
                </h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
                  {entry.body}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-20 pt-8 text-center sm:px-8">
        <h2 className="font-display text-[30px] font-extrabold tracking-[-0.03em] sm:text-[36px]">
          Follow along.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          Open-source on GitHub. Subscribe to releases or follow us for updates.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <a href="https://github.com/ozers/uptimecrow" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/register">Get started free</Link>
          </Button>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
