import { useState } from "react";
import { Link } from "react-router-dom";
import { MarketingNav } from "@/components/marketing-nav";
import "./Landing.css";
import { usePageMeta } from "@/lib/meta";

const BRAND = "UptimeCrow";

const codeBlockStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "1rem 1.25rem",
  overflowX: "auto",
  fontSize: "0.82rem",
};

const CRON_EXAMPLE = `# crontab — nightly backup at 02:00
0 2 * * * /usr/local/bin/backup.sh && \\
  curl -s https://uptimecrow.com/heartbeat/your-slug`;

const CELERY_EXAMPLE = `# Python / Celery
from celery import shared_task
import requests

@shared_task
def nightly_cleanup():
    run_cleanup()
    requests.get("https://uptimecrow.com/heartbeat/your-slug", timeout=5)`;

const GITHUB_ACTIONS_EXAMPLE = `# .github/workflows/scheduled-report.yml
- name: Ping heartbeat
  run: curl -s https://uptimecrow.com/heartbeat/your-slug`;

const INTEGRATIONS = [
  { name: "cron / bash", snippet: CRON_EXAMPLE },
  { name: "Python / Celery", snippet: CELERY_EXAMPLE },
  { name: "GitHub Actions", snippet: GITHUB_ACTIONS_EXAMPLE },
];

const USE_CASES = [
  "Nightly database backups",
  "Scheduled report generation",
  "Email digest jobs",
  "Database cleanup tasks",
  "Log rotation scripts",
  "Data sync pipelines",
  "Certificate renewal (certbot)",
  "Cache warm-up jobs",
];

export default function HeartbeatPage() {
  const [activeTab, setActiveTab] = useState(0);

  usePageMeta({
    title: "Heartbeat Monitoring — Monitor Cron Jobs & Scheduled Tasks | UptimeCrow",
    description:
      "Monitor your cron jobs, background workers, and scheduled tasks with UptimeCrow heartbeat monitoring. Get alerted the moment a job fails to check in. Free on all plans.",
    canonical: "https://uptimecrow.com/heartbeat-monitoring",
  });

  return (
    <div className="landing">
      <MarketingNav />

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge">● Heartbeat Monitoring — cron job observability</div>
          <h1>Know when your cron<br />jobs silently fail.</h1>
          <p className="hero-sub">
            Traditional monitors check if your service is <em>up</em>.
            Heartbeat monitors check if your scheduled tasks actually <em>ran</em>.
            One curl command is all it takes.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn primary">Get Started Free</Link>
            <Link to="/docs" className="hero-btn secondary">Read the docs</Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="section">
        <div className="container">
          <p className="section-label">The silent failure problem</p>
          <h2 className="section-title">Your cron job exited 0. But did it actually work?</h2>
          <div style={{ maxWidth: 760, margin: "0 auto", fontSize: "1rem", lineHeight: 1.7, color: "var(--text2)" }}>
            <p>
              Traditional uptime monitors ping your endpoints and alert when they return an error.
              But cron jobs don't have endpoints. They run in the background, output to a log no one reads,
              and disappear. If your nightly backup quietly fails at 2am, you'll find out weeks later
              when you need to restore — and there's nothing there.
            </p>
            <p style={{ marginTop: "1rem" }}>
              Heartbeat monitoring flips the model: <strong style={{ color: "var(--text)" }}>your job pings us</strong> when it finishes.
              If we don't hear from it within the expected period + a configurable grace window,
              we alert you immediately.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">How it works</p>
          <h2 className="section-title">Three steps. One curl.</h2>
          <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              { step: "1", title: "Create a heartbeat", body: `Give it a name, set the expected period (e.g. every 24h), and a grace window (e.g. 30 min). ${BRAND} generates a unique ping URL.` },
              { step: "2", title: "Add the ping to your job", body: "Append a curl call to your cron entry, Celery task, GitHub Action, or any scheduler. The ping takes < 1ms and uses no credentials." },
              { step: "3", title: "Get alerted on silence", body: `If the heartbeat URL isn't hit within period + grace, ${BRAND} triggers an alert — email, Slack, Discord, PagerDuty, or Telegram.` },
            ].map(({ step, title, body }) => (
              <div key={step} style={{ display: "flex", gap: "1.25rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem 1.5rem", alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.9rem" }}>
                  {step}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: "var(--text)" }}>{title}</p>
                  <p style={{ margin: "0.4rem 0 0", color: "var(--text2)", fontSize: "0.9rem", lineHeight: 1.6 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code examples */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Integrations</p>
          <h2 className="section-title">Works with every scheduler.</h2>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              {INTEGRATIONS.map((item, i) => (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(i)}
                  style={{
                    padding: "0.4rem 0.9rem",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: activeTab === i ? "var(--accent)" : "var(--surface)",
                    color: activeTab === i ? "#fff" : "var(--text2)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: activeTab === i ? 600 : 400,
                  }}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <pre style={codeBlockStyle}><code>{INTEGRATIONS[activeTab].snippet}</code></pre>
            <p style={{ color: "var(--text3)", fontSize: "0.85rem", marginTop: "0.75rem" }}>
              Also works with: Sidekiq, Laravel Scheduler, systemd timers, Kubernetes CronJobs, Render Cron, Railway Cron.
            </p>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Use cases</p>
          <h2 className="section-title">Everything that runs on a schedule.</h2>
          <div style={{ maxWidth: 760, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
            {USE_CASES.map((uc) => (
              <div key={uc} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.75rem 1rem", color: "var(--text2)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span>
                {uc}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">How we compare</p>
          <h2 className="section-title">{BRAND} vs the alternatives.</h2>
          <div className="comparison-scroll">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th scope="col"></th>
                  <th scope="col" className="you">{BRAND}</th>
                  <th scope="col">Cronitor</th>
                  <th scope="col">Healthchecks.io</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Free heartbeats</td>
                  <td className="you-col">3</td>
                  <td>1</td>
                  <td>20</td>
                </tr>
                <tr>
                  <td>Indie / Starter plan</td>
                  <td className="you-col">10 @ $10/mo</td>
                  <td>5 @ $9/mo</td>
                  <td>20 @ $0/mo</td>
                </tr>
                <tr>
                  <td>Pro plan</td>
                  <td className="you-col">25 @ $30/mo</td>
                  <td>unlimited @ $99/mo</td>
                  <td>100 @ $20/mo</td>
                </tr>
                <tr>
                  <td>Team plan</td>
                  <td className="you-col">100 @ $80/mo</td>
                  <td>unlimited @ $249/mo</td>
                  <td>—</td>
                </tr>
                <tr>
                  <td>Also monitors HTTP/TCP</td>
                  <td className="you-col"><span className="check">✓</span></td>
                  <td><span className="check">✓</span></td>
                  <td>✗ heartbeats only</td>
                </tr>
                <tr>
                  <td>Status pages included</td>
                  <td className="you-col"><span className="check">✓</span></td>
                  <td><span className="check">✓</span></td>
                  <td>✗</td>
                </tr>
                <tr>
                  <td>MCP server (AI integration)</td>
                  <td className="you-col"><span className="check">✓</span></td>
                  <td>✗</td>
                  <td>✗</td>
                </tr>
                <tr>
                  <td>Open source / self-hostable</td>
                  <td className="you-col"><span className="check">✓</span></td>
                  <td>✗</td>
                  <td><span className="check">✓</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ color: "var(--text3)", fontSize: "0.8rem", textAlign: "center", marginTop: "0.75rem" }}>
            Prices as of May 2026. Verify on each provider's pricing page.
          </p>
        </div>
      </section>

      {/* Plan limits */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Included in every plan</p>
          <h2 className="section-title">Heartbeats at every tier.</h2>
          <div className="features-grid">
            {[
              { plan: "Free", count: "3 heartbeats", price: "$0/mo", note: "Forever free — no credit card" },
              { plan: "Indie", count: "10 heartbeats", price: "$10/mo", note: "Ideal for solo developers" },
              { plan: "Pro", count: "25 heartbeats", price: "$30/mo", note: "Teams and growing products" },
              { plan: "Team", count: "100 heartbeats", price: "$80/mo", note: "Unlimited monitors + heartbeats" },
            ].map(({ plan, count, price, note }) => (
              <div className="feature" key={plan}>
                <h3>{plan} — {price}</h3>
                <p style={{ fontWeight: 600, color: "var(--accent)", marginBottom: "0.25rem" }}>{count}</p>
                <p>{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Stop finding out about failures the hard way.</h2>
          <p>5 heartbeat monitors free, forever. Add the first one in under a minute.</p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn primary">Get Started Free</Link>
            <Link to="/pricing" className="hero-btn secondary">See full pricing</Link>
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
              <Link to="/vs/betterstack">vs BetterStack</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/login">Log in</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
