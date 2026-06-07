import { Link } from "react-router-dom";
import { MarketingNav } from "@/components/marketing-nav";
import "./Landing.css";
import { usePageMeta } from "@/lib/meta";

const BRAND = "UptimeCrow";

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

const TYPE_STYLES: Record<ChangelogEntry["type"], { color: string; label: string }> = {
  feature: { color: "var(--accent)", label: "Feature" },
  improvement: { color: "#42a5f5", label: "Improvement" },
  fix: { color: "#ab47bc", label: "Fix" },
  security: { color: "#ff5252", label: "Security" },
};

export default function Changelog() {

  usePageMeta({
    title: "Changelog — UptimeCrow",
    description:
      "Every feature, improvement, fix, and security update we ship — in chronological order. UptimeCrow is built in the open.",
    canonical: "https://uptimecrow.com/changelog",
  });

  return (
    <div className="landing">
      <MarketingNav />

      <section className="hero" style={{ paddingBottom: "2rem" }}>
        <div className="container">
          <div className="hero-badge">● Built in the open</div>
          <h1>Changelog</h1>
          <p className="hero-sub">
            Every shipped feature, improvement, and security update. Newest first.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "1rem" }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
            {ENTRIES.map((entry) => {
              const meta = TYPE_STYLES[entry.type];
              return (
                <li
                  key={`${entry.date}-${entry.title}`}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "1.25rem 1.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.15rem 0.55rem",
                        borderRadius: 999,
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        background: meta.color,
                        color: "#000",
                      }}
                    >
                      {meta.label}
                    </span>
                    <time style={{ color: "var(--text3)", fontSize: "0.85rem" }} dateTime={entry.date}>
                      {entry.date}
                    </time>
                  </div>
                  <h3 style={{ margin: "0 0 0.5rem", color: "var(--text)", fontSize: "1.05rem" }}>{entry.title}</h3>
                  <p style={{ margin: 0, color: "var(--text2)", lineHeight: 1.6 }}>{entry.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="final-cta">
        <div className="container">
          <h2>Follow along.</h2>
          <p>Open-source on GitHub. Subscribe to releases or follow us for updates.</p>
          <div className="hero-actions">
            <a href="https://github.com/ozers/uptimecrow" target="_blank" rel="noreferrer" className="hero-btn primary">GitHub</a>
            <Link to="/register" className="hero-btn secondary">Get Started Free</Link>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="footer-bottom">
            <p>&copy; 2026 {BRAND}. Built with care in Istanbul.</p>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/docs">Docs</Link>
              <Link to="/changelog">Changelog</Link>
              <Link to="/tools">Free Tools</Link>
              <Link to="/privacy">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
