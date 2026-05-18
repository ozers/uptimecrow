import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, CheckCircle2, Globe, Heart, Zap, ShieldCheck } from "lucide-react";
import "./Landing.css";
import { usePageMeta } from "@/lib/meta";

const BRAND = "UptimeCrow";

export function FreshpingAlternative() {
  const [mobileOpen, setMobileOpen] = useState(false);

  usePageMeta({
    title: "Best Freshping Alternative 2026 — UptimeCrow | Free Uptime Monitoring",
    description:
      "Freshping shut down and redirected to Freshworks ITSM. UptimeCrow is the best Freshping alternative — free plan with 25 monitors, heartbeat monitoring, pre-rendered status pages, and open-source core.",
    canonical: "https://uptimecrow.com/freshping-alternative",
  });

  const features = [
    {
      Icon: CheckCircle2,
      title: "25 monitors, free forever",
      body: "Freshping's free plan was 50 monitors — generous, but gone. UptimeCrow gives you 25 monitors on a permanent free tier with no time limit and no credit card.",
    },
    {
      Icon: Globe,
      title: "Status pages that survive downtime",
      body: "Your status page is pre-rendered HTML — it stays online even if your origin, API, and database are all down. Freshping's status pages were live-rendered; ours aren't.",
    },
    {
      Icon: Heart,
      title: "Heartbeat & cron job monitoring",
      body: "Monitor your cron jobs, backups, and background workers. A missed ping triggers an immediate alert. Included on every plan, even free (5 heartbeats).",
    },
    {
      Icon: Zap,
      title: "Automatic incident management",
      body: "Downtime detected → incident created, status page updated, subscribers notified. Freshping required manual incident creation. UptimeCrow does it all automatically.",
    },
    {
      Icon: ShieldCheck,
      title: "Open source, self-hostable",
      body: "The full stack is MIT-licensed. Run it on your own infrastructure with docker compose up. No vendor lock-in, no dependency on a hosted service that can shut down.",
    },
  ];

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
            <Link to="/login" onClick={() => setMobileOpen(false)}>Log in</Link>
            <Link to="/register" className="nav-cta mobile-cta" onClick={() => setMobileOpen(false)}>Get Started Free</Link>
          </div>
        )}
      </nav>

      <section className="hero" style={{ paddingBottom: "2rem" }}>
        <div className="container">
          <div className="hero-badge">● Freshping alternative</div>
          <h1>Freshping shut down.<br /><span className="highlight">We've got you covered.</span></h1>
          <p className="hero-sub">
            Freshping redirected to Freshworks ITSM — a product built for enterprise help desks, not uptime monitoring.
            UptimeCrow gives you everything Freshping had, plus heartbeat monitoring, pre-rendered status pages, and an open-source core you can self-host.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn primary">Get Started Free</Link>
            <Link to="/vs/freshping" className="hero-btn secondary">Full comparison →</Link>
          </div>
          <p className="form-note">No credit card required. Live in 3 minutes.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "1rem" }}>
        <div className="container">
          <p className="section-label">What you get</p>
          <h2 className="section-title">Everything Freshping had.<br />And then some.</h2>
          <div className="features-grid">
            {features.map((f) => (
              <div className="feature" key={f.title}>
                <div className="feature-icon"><f.Icon size={22} aria-hidden="true" /></div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Pricing</p>
          <h2 className="section-title">Start free. Scale when ready.</h2>
          <div className="pricing-cards" style={{ maxWidth: 860, margin: "0 auto" }}>
            <div className="price-card">
              <p className="price-name">Free</p>
              <p className="price-amount">$0<span>/mo</span></p>
              <p className="price-desc">Replacing Freshping's free plan.</p>
              <ul className="price-features">
                <li>25 monitors</li>
                <li>1 status page</li>
                <li>1-minute checks</li>
                <li>5 heartbeat monitors</li>
                <li>Slack & Discord alerts</li>
                <li>60-day history</li>
              </ul>
              <Link to="/register" className="price-btn">Get Started Free</Link>
            </div>
            <div className="price-card featured">
              <p className="price-name">Indie</p>
              <p className="price-amount">$12<span>/mo</span></p>
              <p className="price-desc">For indie hackers and solo founders.</p>
              <ul className="price-features">
                <li>25 monitors</li>
                <li>3 status pages</li>
                <li>Custom domain</li>
                <li>10 heartbeat monitors</li>
                <li>90-day history</li>
              </ul>
              <Link to="/register" className="price-btn featured-btn">Get Started</Link>
            </div>
            <div className="price-card">
              <p className="price-name">Pro</p>
              <p className="price-amount">$29<span>/mo</span></p>
              <p className="price-desc">For growing SaaS teams.</p>
              <ul className="price-features">
                <li>50 monitors</li>
                <li>10 status pages</li>
                <li>30-second checks</li>
                <li>API access</li>
                <li>3 team seats</li>
              </ul>
              <Link to="/register" className="price-btn">Get Started</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container">
          <h2>Switch from Freshping in under 3 minutes.</h2>
          <p>Add your monitors, customize your status page, done. No credit card needed.</p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn primary">Get Started Free</Link>
            <Link to="/vs/freshping" className="hero-btn secondary">See full comparison</Link>
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
              <Link to="/vs/freshping">vs Freshping</Link>
              <Link to="/vs/betterstack">vs BetterStack</Link>
              <Link to="/vs/uptimerobot">vs UptimeRobot</Link>
              <Link to="/privacy">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
