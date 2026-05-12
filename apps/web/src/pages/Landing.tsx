import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Radio,
  Palette,
  Mail,
  Timer,
  Menu,
  X,
  Bell,
  ShieldCheck,
  Zap,
  Clock,
  Globe,
  Heart,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import "./Landing.css";

const BRAND = "UptimeCrow";

function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setVisibleLines(10);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let i = 0;
          const interval = setInterval(() => {
            i++;
            setVisibleLines(i);
            if (i >= 10) clearInterval(interval);
          }, 300);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const lines = [
    { time: "03:14:22", content: <><span className="t-red">▼ DOWN</span> <span className="t-white">api.yourapp.com</span> <span className="t-dim">— HTTP 503, response timeout</span></> },
    { time: "03:14:25", content: <><span className="t-amber">● INCIDENT</span> <span className="t-dim">Created:</span> <span className="t-white">"API experiencing elevated error rates"</span></> },
    { time: "03:14:26", content: <><span className="t-amber">● STATUS PAGE</span> <span className="t-dim">Updated → investigating</span></> },
    { time: "03:14:30", content: <span className="t-dim"><span aria-hidden="true">✉ </span>47 subscribers notified via email</span> },
    { time: "03:14:31", content: <span className="t-dim"><span aria-hidden="true">⬡ </span>Slack alert sent to #engineering</span> },
    { time: "03:31:07", content: <><span className="t-green">▲ UP</span> <span className="t-white">api.yourapp.com</span> <span className="t-dim">— 200 OK, 143ms</span></> },
    { time: "03:31:09", content: <><span className="t-green">● RESOLVED</span> <span className="t-dim">Incident closed. Status page updated.</span></> },
    { time: "03:31:10", content: <span className="t-dim"><span aria-hidden="true">✉ </span>47 subscribers notified — resolved</span> },
    { time: "", content: null },
    { time: "", content: <><span className="t-dim">Total downtime:</span> <span className="t-white">16m 45s</span> <span className="t-dim">· Human intervention:</span> <span className="t-green">none</span></> },
  ];

  return (
    <div className="container">
      <div className="demo" ref={ref}>
        <div className="demo-bar">
          <div className="demo-dot r" />
          <div className="demo-dot a" />
          <div className="demo-dot g" />
          <span className="demo-title">incident-timeline.log</span>
        </div>
        <div className="demo-body">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`demo-line ${i < visibleLines ? "visible" : ""}`}
            >
              {line.content === null ? (
                <br />
              ) : (
                <>
                  {line.time && <span className="t-dim">{line.time}</span>}{" "}
                  {line.content}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Preview Mockup ─────────────────────────────────────────────────

function DashboardPreview() {
  const monitors = [
    { name: "api.yourapp.com", status: "up", uptime: "99.99%", ms: 143, pct: 99 },
    { name: "dashboard.yourapp.com", status: "up", uptime: "100%", ms: 89, pct: 100 },
    { name: "auth.yourapp.com", status: "up", uptime: "99.8%", ms: 201, pct: 66 },
    { name: "payments.yourapp.com", status: "up", uptime: "99.95%", ms: 178, pct: 87 },
  ];

  return (
    <div className="mock-browser">
      {/* Browser chrome */}
      <div className="mock-chrome">
        <div className="mock-chrome-dots">
          <span className="mock-dot r" /><span className="mock-dot a" /><span className="mock-dot g" />
        </div>
        <div className="mock-chrome-url">app.uptimecrow.com/dashboard</div>
        <div className="mock-chrome-action"><RefreshCw size={10} /></div>
      </div>

      {/* App layout */}
      <div className="mock-app">
        {/* Sidebar */}
        <div className="mock-sidebar">
          <div className="mock-sidebar-brand">
            <div className="mock-sidebar-logo-dot" />
            <span>UptimeCrow</span>
          </div>
          <div className="mock-nav">
            {["Overview", "Monitors", "Incidents", "Status Pages", "Heartbeats"].map((item, i) => (
              <div key={item} className={`mock-nav-item ${i === 0 ? "active" : ""}`}>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="mock-main">
          {/* Status banner */}
          <div className="mock-banner">
            <div className="mock-banner-dot" />
            <span className="mock-banner-text">All Systems Operational</span>
            <span className="mock-banner-time">Updated 12s ago</span>
          </div>

          {/* Stat cards */}
          <div className="mock-stats">
            {[
              { val: "4", label: "monitors" },
              { val: "99.9%", label: "avg uptime", green: true },
              { val: "0", label: "incidents" },
              { val: "1", label: "status page" },
            ].map(({ val, label, green }) => (
              <div key={label} className="mock-stat-card">
                <div className={`mock-stat-val ${green ? "green" : ""}`}>{val}</div>
                <div className="mock-stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Section label */}
          <div className="mock-section-label">MONITOR STATUS</div>

          {/* Monitor rows */}
          <div className="mock-monitor-list">
            {monitors.map((m) => (
              <div key={m.name} className="mock-monitor-row">
                <div className="mock-monitor-left">
                  <span className="mock-status-dot up" />
                  <span className="mock-monitor-name">{m.name}</span>
                </div>
                <div className="mock-monitor-right">
                  <span className="mock-uptime">{m.uptime}</span>
                  <div className="mock-bar-track">
                    <div className="mock-bar-fill" style={{ width: `${m.pct}%` }} />
                  </div>
                  <span className="mock-ms">{m.ms}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Status Page Preview Mockup ───────────────────────────────────────────────

function StatusPagePreview() {
  const services = [
    { name: "API Service", uptime: "99.99%", bars: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { name: "Web Dashboard", uptime: "100%",  bars: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { name: "Auth Service",  uptime: "99.8%", bars: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0.5,1,1,1,1,1] },
  ];

  return (
    <div className="mock-browser">
      <div className="mock-chrome">
        <div className="mock-chrome-dots">
          <span className="mock-dot r" /><span className="mock-dot a" /><span className="mock-dot g" />
        </div>
        <div className="mock-chrome-url">status.yourapp.com</div>
        <div className="mock-chrome-action" style={{ color: "var(--green)", fontSize: "9px", fontWeight: 600 }}>LIVE</div>
      </div>

      <div className="mock-status-page">
        {/* Header */}
        <div className="mock-sp-header">
          <div className="mock-sp-logo-row">
            <div className="mock-sp-logo-dot" />
            <span className="mock-sp-brand">YourApp Status</span>
          </div>
          <div className="mock-sp-badge operational">
            <span className="mock-sp-badge-dot" />
            All Systems Operational
          </div>
          <div className="mock-sp-time">Last updated 30 seconds ago</div>
        </div>

        {/* Services */}
        <div className="mock-sp-services">
          {services.map((s) => (
            <div key={s.name} className="mock-sp-service">
              <div className="mock-sp-service-row">
                <div className="mock-sp-service-left">
                  <span className="mock-status-dot up" style={{ width: 7, height: 7 }} />
                  <span className="mock-sp-service-name">{s.name}</span>
                </div>
                <span className="mock-sp-uptime">{s.uptime}</span>
              </div>
              <div className="mock-sp-bars">
                {s.bars.map((v, i) => (
                  <div
                    key={i}
                    className="mock-sp-bar"
                    style={{ opacity: v < 1 ? 0.5 : 1, background: v < 1 ? "#f59e0b" : "#22c55e" }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Subscribe */}
        <div className="mock-sp-subscribe">
          <div className="mock-sp-subscribe-input">your@email.com</div>
          <div className="mock-sp-subscribe-btn">Subscribe</div>
        </div>
      </div>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

export function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="landing">
      {/* NAV */}
      <nav>
        <div className="nav-inner">
          <div className="logo">
            <img src="/logo.png" alt="UptimeCrow logo" className="logo-img" />
            <span>{BRAND}</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <Link to="/pricing">Pricing</Link>
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
            <a href="#features" onClick={() => setMobileOpen(false)}>Features</a>
            <Link to="/pricing" onClick={() => setMobileOpen(false)}>Pricing</Link>
            <Link to="/login" onClick={() => setMobileOpen(false)}>Log in</Link>
            <Link to="/register" className="nav-cta mobile-cta" onClick={() => setMobileOpen(false)}>Get Started Free</Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge">● Now available — start monitoring in 3 minutes</div>
          <h1>Your site went down.<br /><span className="highlight">We caught it first.</span></h1>
          <p className="hero-sub">
            Downtime detected → incident created → status page updated → subscribers notified. <strong>All before you wake up.</strong>
          </p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn primary">Get Started Free</Link>
            <a href="#how" className="hero-btn secondary">See how it works</a>
          </div>
          <p className="form-note">Free tier forever. No credit card required.</p>
        </div>
      </section>

      {/* TERMINAL DEMO */}
      <TerminalDemo />

      {/* SOCIAL PROOF STRIP */}
      <div className="proof-strip">
        <div className="proof-inner">
          <div className="proof-item">
            <Zap size={14} aria-hidden="true" />
            <span>Auto incident creation — no manual work</span>
          </div>
          <div className="proof-divider" aria-hidden="true" />
          <div className="proof-item">
            <Clock size={14} aria-hidden="true" />
            <span>1-minute checks free · 30-second checks Pro+</span>
          </div>
          <div className="proof-divider" aria-hidden="true" />
          <div className="proof-item">
            <Globe size={14} aria-hidden="true" />
            <span>Status pages that survive outages</span>
          </div>
          <div className="proof-divider" aria-hidden="true" />
          <div className="proof-item">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>Free forever — no credit card</span>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="section" id="how">
        <div className="container">
          <p className="section-label">How it works</p>
          <h2 className="section-title">Three minutes to set up.<br />Zero minutes to manage.</h2>
          <p className="section-desc">Add your endpoints, customize your status page, go to sleep. We handle the rest.</p>
          <div className="steps">
            <div className="step">
              <div className="step-num">01</div>
              <h3>Add your endpoints</h3>
              <p>HTTP, TCP, or keyword checks. We ping every minute from multiple regions. If it's down, we know fast — and heartbeat monitoring keeps an eye on your cron jobs too.</p>
            </div>
            <div className="step">
              <div className="step-num">02</div>
              <h3>Incidents are handled automatically</h3>
              <p>Downtime detected → incident created, status update written, and status page updated instantly. No manual work needed.</p>
            </div>
            <div className="step">
              <div className="step-num">03</div>
              <h3>Subscribers stay informed</h3>
              <p>Email and Slack — your users know what's happening the moment it does. When it's resolved, everyone gets notified automatically.</p>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section className="section preview-section" id="product" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="preview-layout">
            <div className="preview-copy">
              <p className="section-label">The Dashboard</p>
              <h2 className="preview-title">Your uptime<br />command center.</h2>
              <p className="preview-desc">
                Everything you need to stay on top of service health — at a glance.
                Monitor status, uptime percentages, response times, and active incidents,
                all in one view that refreshes automatically.
              </p>
              <ul className="preview-bullets">
                <li>
                  <Activity size={14} aria-hidden="true" />
                  <span>Live status for every monitor</span>
                </li>
                <li>
                  <AlertTriangle size={14} aria-hidden="true" />
                  <span>Active incidents surfaced instantly</span>
                </li>
                <li>
                  <CheckCircle2 size={14} aria-hidden="true" />
                  <span>Uptime % and response times always visible</span>
                </li>
                <li>
                  <ArrowRight size={14} aria-hidden="true" />
                  <span>One click to drill into any monitor or incident</span>
                </li>
              </ul>
              <Link to="/register" className="hero-btn primary" style={{ display: "inline-flex", marginTop: "1.5rem" }}>
                Start monitoring free
              </Link>
            </div>
            <div className="preview-mock">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* STATUS PAGE PREVIEW */}
      <section className="section preview-section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="preview-layout reverse">
            <div className="preview-copy">
              <p className="section-label">The Status Page</p>
              <h2 className="preview-title">Your users stay<br />in the loop.</h2>
              <p className="preview-desc">
                A public status page hosted at your custom domain. When a monitor goes
                down, the page updates automatically — your users see it before they
                even think to email you.
              </p>
              <ul className="preview-bullets">
                <li>
                  <Globe size={14} aria-hidden="true" />
                  <span>Custom domain (status.yourapp.com)</span>
                </li>
                <li>
                  <ShieldCheck size={14} aria-hidden="true" />
                  <span>Pre-rendered — survives origin downtime</span>
                </li>
                <li>
                  <Mail size={14} aria-hidden="true" />
                  <span>Email subscribe form built in</span>
                </li>
                <li>
                  <Timer size={14} aria-hidden="true" />
                  <span>90-day uptime bar per service</span>
                </li>
              </ul>
            </div>
            <div className="preview-mock">
              <StatusPagePreview />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="features" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Features</p>
          <h2 className="section-title">Everything you need.<br />Nothing you don't.</h2>
          <div className="features-grid">
            {[
              { Icon: ShieldCheck, title: "Automatic Incident Detection", desc: "Consecutive failure confirmation prevents false alarms. When it's really down, an incident is created and your status page is updated automatically." },
              { Icon: Radio, title: "Uptime Monitoring", desc: "HTTP, TCP, and keyword checks every minute from multiple regions. Sub-minute detection with configurable confirmation counts." },
              { Icon: Heart, title: "Heartbeat Monitoring", desc: "Monitor cron jobs and scheduled tasks. Your service pings a unique URL — if we don't hear from it, we alert you. Available on every plan." },
              { Icon: Palette, title: "Beautiful Status Pages", desc: "Hosted on your custom domain. Clean, fast, branded. Your users see a professional page — not a wall of technical jargon." },
              { Icon: Mail, title: "Subscriber Notifications", desc: "Email and Slack alerts when incidents start and resolve. Your users subscribe themselves — zero friction on your end." },
              { Icon: Bell, title: "Instant Alerts", desc: "Get notified the moment something goes wrong via Slack or Discord webhooks. Know before your users do." },
              { Icon: Timer, title: "Uptime Badge", desc: "Embed a real-time uptime badge on your site, README, or docs. Social proof that builds trust automatically." },
            ].map((f) => (
              <div className="feature" key={f.title}>
                <div className="feature-icon"><f.Icon size={22} aria-hidden="true" /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Why switch</p>
          <h2 className="section-title">Simple, affordable, and complete.</h2>
          <p className="section-desc">Most status page tools charge enterprise prices for features you actually need. UptimeCrow gives you monitoring, status pages, and notifications — without the bloat.</p>
          <div className="comparison-scroll">
          <table className="comparison-table">
            <thead>
              <tr>
                <th scope="col"></th>
                <th scope="col" className="you">{BRAND}</th>
                <th scope="col">Betterstack</th>
                <th scope="col">Instatus</th>
                <th scope="col">Statuspage.io</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: "Auto incident creation", us: "✓ Automatic", bs: "✗ Manual", ins: "✗ Manual", sp: "✗ Manual" },
                { feature: "Auto status page update", us: "✓ Automatic", bs: "✗ Manual", ins: "✗ Manual", sp: "✗ Manual" },
                { feature: "Uptime monitoring", us: "✓ 1-min intervals", bs: "✓", ins: "✓", sp: "Add-on" },
                { feature: "Subscriber notifications", us: "✓ Email + Slack", bs: "✓", ins: "✓", sp: "✓" },
                { feature: "Custom domain", us: "✓", bs: "✓", ins: "✓", sp: "✓" },
                { feature: "Free tier", us: "✓ Forever free", bs: "Trial only", ins: "✓", sp: "✗" },
                { feature: "Heartbeat monitoring", us: "✓ All plans", bs: "✓ Paid only", ins: "✗", sp: "✗" },
                { feature: "Starting price", us: "$12/mo (Indie)", bs: "$24/mo", ins: "$20/mo", sp: "$79/mo" },
              ].map((row) => (
                <tr key={row.feature}>
                  <td>{row.feature}</td>
                  <td className="you-col">{row.us.startsWith("✓") ? <><span className="check">✓</span>{row.us.slice(1)}</> : row.us}</td>
                  <td>{row.bs.startsWith("✗") ? <><span className="cross">✗</span>{row.bs.slice(1)}</> : row.bs.startsWith("✓") ? <><span className="check">✓</span>{row.bs.slice(1)}</> : row.bs}</td>
                  <td>{row.ins.startsWith("✗") ? <><span className="cross">✗</span>{row.ins.slice(1)}</> : row.ins.startsWith("✓") ? <><span className="check">✓</span>{row.ins.slice(1)}</> : row.ins}</td>
                  <td>{row.sp.startsWith("✗") ? <><span className="cross">✗</span>{row.sp.slice(1)}</> : row.sp.startsWith("✓") ? <><span className="check">✓</span>{row.sp.slice(1)}</> : row.sp}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="pricing" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Pricing</p>
          <h2 className="section-title">Start free. Scale when ready.</h2>
          <div className="pricing-cards">
            <div className="price-card">
              <p className="price-name">Free</p>
              <p className="price-amount">$0<span>/mo</span></p>
              <p className="price-desc">For side projects and personal apps.</p>
              <ul className="price-features">
                <li>1 status page</li>
                <li>10 monitors</li>
                <li>1-minute check intervals</li>
                <li>3 heartbeat monitors</li>
                <li>Slack & Discord alerts</li>
                <li>Uptime badge</li>
                <li>30-day history</li>
              </ul>
              <Link to="/register" className="price-btn">Get Started</Link>
            </div>
            <div className="price-card">
              <p className="price-name">Indie</p>
              <p className="price-amount">$12<span>/mo</span></p>
              <p className="price-desc">For indie hackers and solo founders.</p>
              <ul className="price-features">
                <li>3 status pages</li>
                <li>25 monitors</li>
                <li>1-minute check intervals</li>
                <li>10 heartbeat monitors</li>
                <li>Custom domain</li>
                <li>90-day history</li>
              </ul>
              <Link to="/register" className="price-btn">Get Started</Link>
            </div>
            <div className="price-card featured">
              <p className="price-name">Pro</p>
              <p className="price-amount">$29<span>/mo</span></p>
              <p className="price-desc">For growing SaaS teams.</p>
              <ul className="price-features">
                <li>10 status pages</li>
                <li>50 monitors</li>
                <li>30-second check intervals</li>
                <li>25 heartbeat monitors</li>
                <li>Custom domain + API access</li>
                <li>3 team seats</li>
                <li>90-day history</li>
              </ul>
              <Link to="/register" className="price-btn featured-btn">Get Started</Link>
            </div>
            <div className="price-card">
              <p className="price-name">Team</p>
              <p className="price-amount">$79<span>/mo</span></p>
              <p className="price-desc">For teams that ship fast.</p>
              <ul className="price-features">
                <li>Everything in Pro</li>
                <li>200 monitors</li>
                <li>100 heartbeat monitors</li>
                <li>Multi-region checks</li>
                <li>10 team seats</li>
                <li>365-day history</li>
              </ul>
              <Link to="/register" className="price-btn">Get Started</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta">
        <div className="container">
          <div className="final-cta-logo">
            <div className="hero-logo-glow" />
            <img src="/logo.png" alt="UptimeCrow" className="hero-logo" />
          </div>
          <h2>Know when your site is down before your users do.</h2>
          <p>Start monitoring for free. Set up in under 3 minutes.</p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn primary">Get Started Free</Link>
            <Link to="/login" className="hero-btn secondary">Log in</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <img src="/logo.png" alt="UptimeCrow logo" className="logo-img" />
              <span className="footer-brand-name">{BRAND}</span>
            </div>
            <div className="footer-cols">
              <div className="footer-col">
                <p className="footer-col-label">Product</p>
                <a href="#features">Features</a>
                <Link to="/pricing">Pricing</Link>
                <a href="/api/docs" target="_blank" rel="noopener noreferrer">API Docs</a>
              </div>
              <div className="footer-col">
                <p className="footer-col-label">Compare</p>
                <Link to="/vs/betterstack">vs Betterstack</Link>
                <Link to="/vs/uptimerobot">vs UptimeRobot</Link>
              </div>
              <div className="footer-col">
                <p className="footer-col-label">Legal</p>
                <Link to="/privacy">Privacy</Link>
                <Link to="/terms">Terms</Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 {BRAND}. Built with care in Istanbul.</p>
            <div className="footer-links">
              <a href="https://github.com/uptimecrow" target="_blank" rel="noopener noreferrer">GitHub</a>
              <Link to="/login">Log in</Link>
              <Link to="/register">Get Started</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
