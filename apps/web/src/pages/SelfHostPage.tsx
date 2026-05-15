import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
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

const COMPOSE_SNIPPET = `version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: uptimecrow
      POSTGRES_USER: uptimecrow
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

  api:
    image: ghcr.io/uptimecrow/api:latest
    depends_on: [postgres, redis]
    environment:
      MODE: all
      DATABASE_URL: postgres://uptimecrow:\${POSTGRES_PASSWORD}@postgres:5432/uptimecrow
      REDIS_URL: redis://redis:6379
      JWT_SECRET: \${JWT_SECRET}
      APP_URL: \${APP_URL}
      # Optional — email alerts via Amazon SES
      AWS_ACCESS_KEY_ID: \${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: \${AWS_SECRET_ACCESS_KEY}
      AWS_REGION: us-east-1
      SES_FROM_EMAIL: alerts@yourdomain.com
    ports:
      - "3000:3000"

  web:
    image: ghcr.io/uptimecrow/web:latest
    depends_on: [api]
    ports:
      - "80:80"

volumes:
  pgdata:
  redisdata:`;

const ENV_SNIPPET = `# .env
POSTGRES_PASSWORD=change_me_in_production
JWT_SECRET=at_least_32_random_characters_here
APP_URL=https://uptime.yourdomain.com

# Optional: Amazon SES for email alerts
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...`;

const START_SNIPPET = `# Pull images and start all 4 containers
docker compose up -d

# Run database migrations
docker compose exec api pnpm db:migrate

# Check everything is healthy
docker compose ps`;

export default function SelfHostPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  usePageMeta({
    title: "Self-Host UptimeCrow — Open-Source Uptime Monitoring with Docker",
    description:
      "Run UptimeCrow on your own infrastructure with a single Docker Compose command. MIT-licensed, open-source uptime monitoring and status pages. No vendor lock-in.",
    canonical: "https://uptimecrow.com/self-host",
  });

  return (
    <div className="landing">
      <nav>
        <div className="nav-inner">
          <div className="logo">
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "inherit", textDecoration: "none" }}>
              <img src="/logo.png" alt="UptimeCrow logo" className="logo-img" />
              <span>{BRAND}</span>
            </Link>
          </div>
          <div className="nav-links">
            <Link to="/#features">Features</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/docs">Docs</Link>
            <Link to="/login" className="nav-login">Log in</Link>
            <Link to="/register" className="nav-cta">Get Started Free</Link>
          </div>
          <button
            className="nav-hamburger"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="nav-mobile" role="dialog" aria-label="Mobile navigation">
            <Link to="/#features" onClick={() => setMobileOpen(false)}>Features</Link>
            <Link to="/pricing" onClick={() => setMobileOpen(false)}>Pricing</Link>
            <Link to="/docs" onClick={() => setMobileOpen(false)}>Docs</Link>
            <Link to="/login" onClick={() => setMobileOpen(false)}>Log in</Link>
            <Link to="/register" className="nav-cta mobile-cta" onClick={() => setMobileOpen(false)}>Get Started Free</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge">● MIT Licensed — own your monitoring stack</div>
          <h1>Run your own uptime<br />monitor in 5 minutes.</h1>
          <p className="hero-sub">
            4 Docker containers. 512 MB RAM. Any VPS. Full source code included —
            fork it, extend it, or just run it as-is.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn primary">Use the cloud version free</Link>
            <a
              href="https://github.com/uptimecrow/uptimecrow"
              className="hero-btn secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="section">
        <div className="container">
          <p className="section-label">Requirements</p>
          <h2 className="section-title">Nothing exotic.</h2>
          <div className="features-grid" style={{ maxWidth: 760, margin: "0 auto" }}>
            <div className="feature">
              <h3>Docker + Compose</h3>
              <p>Any machine running Docker Engine 24+ and Docker Compose v2. That's the only hard requirement.</p>
            </div>
            <div className="feature">
              <h3>512 MB RAM</h3>
              <p>A $4/mo VPS handles dozens of monitors comfortably. Scale up when you need more check frequency or history retention.</p>
            </div>
            <div className="feature">
              <h3>Optional: SES</h3>
              <p>Email alerts need Amazon SES. Slack and Discord webhooks work without any email config — you can add SES later.</p>
            </div>
          </div>
        </div>
      </section>

      {/* docker-compose.yml */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Configuration</p>
          <h2 className="section-title">The full stack in one file.</h2>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <p style={{ color: "var(--text2)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
              Postgres 16, Redis 7, the {BRAND} API + worker, and the nginx-served web UI.
              Copy this into <code>docker-compose.yml</code> and create a <code>.env</code> alongside it.
            </p>
            <pre style={codeBlockStyle}><code>{COMPOSE_SNIPPET}</code></pre>

            <p style={{ fontWeight: 600, margin: "1.75rem 0 0.5rem", color: "var(--text)" }}>
              Environment variables (<code>.env</code>)
            </p>
            <pre style={codeBlockStyle}><code>{ENV_SNIPPET}</code></pre>

            <p style={{ fontWeight: 600, margin: "1.75rem 0 0.5rem", color: "var(--text)" }}>
              Start everything
            </p>
            <pre style={codeBlockStyle}><code>{START_SNIPPET}</code></pre>

            <p style={{ color: "var(--text2)", fontSize: "0.9rem", marginTop: "1rem", lineHeight: 1.6 }}>
              After <code>docker compose up</code>: the web UI is on <strong style={{ color: "var(--text)" }}>:80</strong> (nginx, production)
              or <strong style={{ color: "var(--text)" }}>:5173</strong> (Vite dev server). API is always on <strong style={{ color: "var(--text)" }}>:3000</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* vs cloud */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Self-host vs cloud</p>
          <h2 className="section-title">Pick what fits your situation.</h2>
          <div className="comparison-scroll">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th scope="col"></th>
                  <th scope="col" className="you">Self-hosted</th>
                  <th scope="col">{BRAND} Cloud</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Data ownership</td>
                  <td className="you-col"><span className="check">✓</span> 100% yours</td>
                  <td>Hosted on our infra</td>
                </tr>
                <tr>
                  <td>Cost at scale</td>
                  <td className="you-col"><span className="check">✓</span> VPS cost only</td>
                  <td>Per-plan pricing</td>
                </tr>
                <tr>
                  <td>Setup time</td>
                  <td className="you-col">~5 minutes</td>
                  <td><span className="check">✓</span> 30 seconds</td>
                </tr>
                <tr>
                  <td>Maintenance</td>
                  <td className="you-col">You manage updates</td>
                  <td><span className="check">✓</span> Automatic</td>
                </tr>
                <tr>
                  <td>Uptime SLA</td>
                  <td className="you-col">Depends on your VPS</td>
                  <td><span className="check">✓</span> 99.9%</td>
                </tr>
                <tr>
                  <td>Custom extensions</td>
                  <td className="you-col"><span className="check">✓</span> Full source access</td>
                  <td>Fixed feature set</td>
                </tr>
                <tr>
                  <td>Multi-region checks</td>
                  <td className="you-col">Single region</td>
                  <td><span className="check">✓</span> 5 regions (Pro+)</td>
                </tr>
                <tr>
                  <td>License</td>
                  <td className="you-col"><span className="check">✓</span> MIT — no restrictions</td>
                  <td>SaaS ToS</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Why self-host */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Common reasons</p>
          <h2 className="section-title">When self-hosting is the right call.</h2>
          <div className="features-grid">
            <div className="feature">
              <h3>Compliance requirements</h3>
              <p>SOC 2, HIPAA, or internal policies that forbid sending infrastructure data to third-party SaaS tools.</p>
            </div>
            <div className="feature">
              <h3>Air-gapped environments</h3>
              <p>Monitor internal services that are never exposed to the public internet. Your checker runs inside your network.</p>
            </div>
            <div className="feature">
              <h3>Cost predictability</h3>
              <p>Monitoring 500 endpoints? A $20/mo VPS beats any per-monitor pricing tier at that scale.</p>
            </div>
            <div className="feature">
              <h3>Full customisation</h3>
              <p>Add custom check types, notification channels, or integrate with internal tooling. It's your codebase now.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Start on the cloud. Move to self-host whenever.</h2>
          <p>The cloud version is free for up to 10 monitors. Export your data and self-host when you're ready.</p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn primary">Get Started Free</Link>
            <Link to="/docs" className="hero-btn secondary">Self-host docs</Link>
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
