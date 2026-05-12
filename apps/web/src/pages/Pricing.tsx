import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import "./Landing.css";

const BRAND = "UptimeCrow";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    per: "/mo",
    desc: "For side projects and personal apps.",
    features: [
      "1 status page",
      "10 monitors",
      "1-minute check intervals",
      "3 heartbeat monitors",
      "Automatic incident management",
      "Slack & Discord alerts",
      "Uptime badge",
      "30-day history",
    ],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Indie",
    price: "$12",
    per: "/mo",
    desc: "For indie hackers and solo founders.",
    features: [
      "3 status pages",
      "25 monitors",
      "1-minute check intervals",
      "10 heartbeat monitors",
      "Custom domain",
      "Slack & Discord alerts",
      "90-day history",
    ],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Pro",
    price: "$29",
    per: "/mo",
    desc: "For growing SaaS teams.",
    features: [
      "10 status pages",
      "50 monitors",
      "30-second check intervals",
      "25 heartbeat monitors",
      "Custom domain",
      "API access",
      "3 team seats",
      "90-day history",
    ],
    cta: "Get Started",
    featured: true,
  },
  {
    name: "Team",
    price: "$79",
    per: "/mo",
    desc: "For teams that ship fast.",
    features: [
      "Everything in Pro",
      "200 monitors",
      "100 heartbeat monitors",
      "Multi-region checks",
      "10 team seats",
      "365-day history",
      "Priority support",
    ],
    cta: "Get Started",
    featured: false,
  },
];

const FAQ = [
  {
    q: "How do I upgrade right now?",
    a: "Online checkout and coupon redemption are temporarily paused while we migrate our billing infrastructure. In the meantime, email support@uptimecrow.com with your account email and the plan you want — we'll activate it manually, usually the same day.",
  },
  {
    q: "Is there a free trial for Pro or Team?",
    a: "Not yet. The Free plan is free forever — use it until you outgrow the 10-monitor limit, then upgrade. Refunds on paid plans are handled case-by-case within 14 days of purchase.",
  },
  {
    q: "Can I change or cancel my plan anytime?",
    a: "Yes. Downgrades take effect at the end of your current billing period, so you keep the features you paid for. While self-serve billing is paused, email support@uptimecrow.com for plan changes and we'll process them by hand.",
  },
  {
    q: "How does billing work?",
    a: "Paid plans are billed monthly through Polar. You can pay by card, PayPal, or supported crypto. Invoices are emailed automatically and are also available in the customer portal — once self-serve checkout is back online.",
  },
  {
    q: "What counts as a monitor?",
    a: "Each HTTP, TCP, or keyword check is one monitor. If you watch the same URL with keyword matching and a status-code check, that's one monitor — not two.",
  },
  {
    q: "Do you offer annual discounts or an enterprise plan?",
    a: "Annual billing and enterprise SLAs are on the roadmap. If you need SSO, a DPA, a custom invoice, or more than 50 monitors, email support@uptimecrow.com and we'll sort it out.",
  },
  {
    q: "Can I self-host UptimeCrow?",
    a: "Yes. The core is MIT-licensed and the entire stack runs on Docker Compose. See the README on GitHub for the self-host guide.",
  },
];

export function Pricing() {
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <div className="hero-badge">● Fair pricing, no lock-in</div>
          <h1>Simple pricing.<br /><span className="highlight">Pick a plan that fits.</span></h1>
          <p className="hero-sub">
            Start free forever. Upgrade when you need more monitors, faster checks, or a branded status page.
          </p>
          <div
            role="status"
            style={{
              marginTop: "1.75rem",
              padding: "0.9rem 1.1rem",
              background: "var(--amber)18",
              border: "1px solid var(--amber)",
              borderRadius: 12,
              color: "var(--text)",
              fontSize: "0.92rem",
              lineHeight: 1.6,
              maxWidth: 640,
              marginInline: "auto",
              textAlign: "left",
            }}
          >
            <strong style={{ color: "var(--amber)" }}>Heads up:</strong> online payments and coupon
            redemption are temporarily paused while we migrate our billing infrastructure. To upgrade or
            use a coupon in the meantime, email{" "}
            <a href="mailto:support@uptimecrow.com" style={{ color: "var(--green)", textDecoration: "underline" }}>
              support@uptimecrow.com
            </a>{" "}
            and we'll help you out.
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "1rem" }}>
        <div className="container">
          <div className="pricing-cards">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`price-card${plan.featured ? " featured" : ""}`}>
                <p className="price-name">{plan.name}</p>
                <p className="price-amount">{plan.price}<span>{plan.per}</span></p>
                <p className="price-desc">{plan.desc}</p>
                <ul className="price-features">
                  {plan.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <Link to="/register" className={`price-btn${plan.featured ? " featured-btn" : ""}`}>{plan.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-label">Frequently asked</p>
          <h2 className="section-title">Before you commit.</h2>
          <div style={{ display: "grid", gap: "1rem", maxWidth: 760, margin: "2rem auto 0" }}>
            {FAQ.map((item) => (
              <details
                key={item.q}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "1.1rem 1.3rem",
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--text)",
                    listStyle: "none",
                  }}
                >
                  {item.q}
                </summary>
                <p style={{ marginTop: "0.8rem", color: "var(--text2)", lineHeight: 1.6, fontSize: "0.95rem" }}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container">
          <h2>Ready to know when you're down?</h2>
          <p>10 monitors, 1-min checks, forever free. No credit card needed.</p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn primary">Get Started Free</Link>
            <Link to="/login" className="hero-btn secondary">Log in</Link>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="footer-bottom">
            <p>&copy; 2026 {BRAND}. Built with care in Istanbul.</p>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/vs/betterstack">vs Betterstack</Link>
              <Link to="/vs/uptimerobot">vs UptimeRobot</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
              <Link to="/login">Log in</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
